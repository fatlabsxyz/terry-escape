use dep::bignum::{params::BigNumParams, RuntimeBigNum};

fn encrypt_p<let Tau: u32, let Num: u32, let Bits: u32>(
    params: BigNumParams<Num, Bits>,
    key_set: [[Field; Num]; Tau],
    entropy: [bool; Tau],
    message: bool,
) -> RuntimeBigNum<Num, Bits> {
    encrypt_batched(params, key_set, entropy, message)
}

// Needs over 16 GiB of RAM to compile on Tau >= 1000 :(
fn encrypt_expression<let Tau: u32, let Num: u32, let Bits: u32>(
    params: BigNumParams<Num, Bits>,
    key_set: [[Field; Num]; Tau],
    entropy: [bool; Tau],
    message: bool,
) -> RuntimeBigNum<Num, Bits> {
    let mut terms = [RuntimeBigNum::new(params); Tau + 1];
    let mut sum = RuntimeBigNum::new(params);
    for i in 0..Tau {
        if entropy[i] {
            let term = RuntimeBigNum::from_array(params, key_set[i]);
            terms[i] = term;
            sum = unsafe { sum.__add(term) };
        }
    }

    let mut flags = [false; Tau + 1];
    terms[Tau] = sum;
    flags[Tau] = true;

    RuntimeBigNum::evaluate_quadratic_expression(
        params,
        [[]; 0],
        [[]; 0],
        [[]; 0],
        [[]; 0],
        terms,
        flags,
    );
    if message {
        let _1 = RuntimeBigNum::one(params);
        let _2 = _1 + _1;
        sum += RuntimeBigNum::from_array(params, key_set[0]).udiv(_2);
    }
    sum
}



global batch_size: u32 = 8;

pub fn encrypt_batched<let Tau: u32, let Limbs: u32, let Bits: u32>(
    params: BigNumParams<Limbs, Bits>,
    key_set: [[Field; Limbs]; Tau],
    entropy: [bool; Tau],
    message: bool,
) -> RuntimeBigNum<Limbs, Bits> {
    let mut sum = RuntimeBigNum::new(params);
    for batch_index in 0..(Tau / batch_size) {
        let mut sub_entropy = [false; batch_size];
        let mut sub_key_set = [[0; Limbs]; batch_size];
        for term_index in 0..batch_size {
            sub_entropy[term_index] = entropy[batch_index * batch_size + term_index];
            sub_key_set[term_index] = key_set[batch_index * batch_size + term_index];
        }
        sum += select_key_samples(params, sub_key_set, sub_entropy);
    }
    {
        let mut sub_entropy = [false; Tau % batch_size];
        let mut sub_key_set = [[0; Limbs]; Tau % batch_size];
        for term_index in 0..(Tau % batch_size) {
            sub_entropy[term_index] = entropy[Tau - (Tau % batch_size) + term_index];
            sub_key_set[term_index] = key_set[Tau - (Tau % batch_size) + term_index];
        }
        sum += select_key_samples(params, sub_key_set, sub_entropy);
    }

    if message {
        let _1 = RuntimeBigNum::one(params);
        let _2 = _1 + _1;
        // TODO: fix yet another blocking maybe BigNum bug? 
        // sum += RuntimeBigNum::from_array(params, key_set[0]).udiv(_2);
    }

    sum
}

fn select_key_samples<let SubTau: u32, let Limbs: u32, let Bits: u32>(
    params: BigNumParams<Limbs, Bits>,
    sub_key_set: [[Field; Limbs]; SubTau],
    sub_entropy: [bool; SubTau],
) -> RuntimeBigNum<Limbs, Bits> {
    let mut sum = RuntimeBigNum::new(params);
    for index in 0..SubTau {
        if sub_entropy[index] {
            sum += RuntimeBigNum::from_array(params, sub_key_set[index]);
        }
    }
    sum
}






/* Old implementations using BigNums fixed since compile time */
// TODO: cleaning up and refactoring in progress

global OLD_TAU: u32 = 1289;

fn encrypt(key: [AGCD; OLD_TAU], entropy: [bool; OLD_TAU], message: bool) -> AGCD {
    let _1: AGCD = BigNum::one();
    let _2 = _1 + _1;

    let mut sum = BigNum::new();
    for index in 0..OLD_TAU {
        if entropy[index] {
            sum += key[index];
        }
    }
    if message {
        //sum += key[0].udiv(_2);
    }
    sum
}

fn encrypt_fast(mut key_set: [AGCD; OLD_TAU], entropy: [bool; OLD_TAU], message: bool) -> AGCD {
    let mut terms = [BigNum::new(); OLD_TAU + 1];
    let mut sum = BigNum::new();
    for i in 0..OLD_TAU {
        if entropy[i] {
            terms[i] = key_set[i];
            sum = unsafe { sum.__add(key_set[i]) };
        }
    }

    let mut flags = [false; OLD_TAU + 1];
    terms[OLD_TAU] = sum;
    flags[OLD_TAU] = true;

    BigNum::evaluate_quadratic_expression([[]; 0], [[]; 0], [[]; 0], [[]; 0], terms, flags);

    if message {
        let _1: AGCD = BigNum::one();
        let _2 = _1 + _1;
        //        sum += key_set[0].udiv(_2);
    }
    sum
}

global SLICE: u32 = 47;

fn encrypt_maybe_faster(mut key: [AGCD; OLD_TAU], entropy: [bool; OLD_TAU], message: bool) -> AGCD {
    let mut sums = [BigNum::new(); OLD_TAU / SLICE + 1];
    for i in 0..(OLD_TAU / SLICE) {
        let mut terms = [BigNum::new(); SLICE + 1];
        for j in 0..SLICE {
            if entropy[i * SLICE + j] {
                terms[j + 1] = key[i * SLICE + j];
                sums[i + 1] = unsafe { sums[i + 1].__add(key[i * SLICE + j]) };
            }
        }
        sums[0] = unsafe { sums[0].__add(sums[i + 1]) };
        terms[0] = sums[i + 1];
        let mut flags = [false; SLICE + 1];
        flags[0] = true;
        BigNum::evaluate_quadratic_expression([[]; 0], [[]; 0], [[]; 0], [[]; 0], terms, flags);
    }
    let mut flags = [false; OLD_TAU / SLICE + 1];
    flags[0] = true;
    BigNum::evaluate_quadratic_expression([[]; 0], [[]; 0], [[]; 0], [[]; 0], sums, flags);

    if message {
        let _1: AGCD = BigNum::one();
        let _2 = _1 + _1;
        //        sums[0] += key[0].udiv(_2);
    }

    sums[0]
}

fn decrypt(p: AGCD, c: AGCD) -> bool {
    let _1: AGCD = BigNum::one();
    let _2 = _1 + _1;

    // round_nearest(2*c/p)%2 == 1
    let (c_udiv_p, c_umod_p) = c.udiv_mod(p);
    (c_udiv_p + c_udiv_p + (c_umod_p + c_umod_p + p.udiv(_2)).udiv(p)).umod(_2) == _1
}

fn decrypt_noise(p: AGCD, c: AGCD) -> AGCD {
    let _1: AGCD = BigNum::one();
    let _2 = _1 + _1;

    // ~ c%(p/2)
    c.umod(p.udiv(_2))
}

#[test]
fn test_encrypt_decrypt() {
    let decryption_key = BigNum::from_slice([1, 4, 2, 8, 5, 7, 0, 0, 0]);
    let encryption_key = [decryption_key; OLD_TAU];
    let mut entropy = [false; OLD_TAU];
    for i in 0..15 {
        entropy[(i * 7) % OLD_TAU] = true;
    }
    assert(decrypt(decryption_key, encrypt_fast(encryption_key, entropy, true)) == true);
    assert(decrypt(decryption_key, encrypt_fast(encryption_key, entropy, false)) == false);
}

// (Harcoded for security parameter=128)
pub fn validate_keypair(
    common_divisor_entropy: [Field; 8],
    multiplier_entropy: [[Field; 2]; OLD_TAU],
    additive_entropy: [[Field; 2]; OLD_TAU],
    resulting_samples: [[Field; 9]; OLD_TAU],
) {
    // Assert that p has 128*7 bits or less
    let TWO_POW_120 = 0x1_00000_00000_00000_00000_00000_00000;
    for i in 0..7 {
        assert(common_divisor_entropy[i].lt(TWO_POW_120));
    }
    let TWO_POW_56 = 0x10000_00000_00000;
    assert(common_divisor_entropy[7].lt(TWO_POW_56));

    let mut decryption_key_limbs = [0; 9];
    for i in 0..8 {
        decryption_key_limbs[i] = common_divisor_entropy[i];
    }
    let decryption_key: MC1031 = BigNum::from_slice(decryption_key_limbs);

    for i in 0..OLD_TAU {
        // Assert that q's have 128+7 bits or less
        assert(multiplier_entropy[i][0].lt(TWO_POW_120));
        assert(multiplier_entropy[i][1].lt((2 << 15) as Field));

        // Assert that r's have 128 bits or less
        assert(additive_entropy[i][0].lt(TWO_POW_120));
        assert(additive_entropy[i][1].lt((2 << 8) as Field));

        let mut multiplier_limbs = [0; 9];
        multiplier_limbs[0] = multiplier_entropy[i][0];
        multiplier_limbs[1] = multiplier_entropy[i][1];
        let multiplier = BigNum::from_slice(multiplier_limbs);

        let mut added_noise_limbs = [0; 9];
        added_noise_limbs[0] = additive_entropy[i][0];
        added_noise_limbs[1] = additive_entropy[i][1];
        let added_noise = BigNum::from_slice(added_noise_limbs);
        let TWO_POW_127 = BigNum::from_slice([0, 0x80, 0, 0, 0, 0, 0, 0, 0]);

        assert(
            resulting_samples[i] == (decryption_key * multiplier + added_noise - TWO_POW_127).limbs,
        );
    }
}

#[test]
fn bignum_bugs() {
    let _1: AGCD = BigNum::one();
    let _2 = _1 + _1;

    _1.udiv_mod(_2);

    let n: AGCD = BigNum::from_slice([0, 2, 0, 0, 0, 0, 0, 0, 0]);
    let d: AGCD = BigNum::from_slice([1, 1, 0, 0, 0, 0, 0, 0, 0]);
    n.udiv_mod(d);
}

#[test]
fn uniform_noise_potential_detector() {
    let _1: AGCD = BigNum::one();
    let _2 = _1 + _1;

    let dk = BigNum::from_slice([1, 4, 2, 8, 5, 7, 0, 0, 0]);
    let ek = [dk + _1; OLD_TAU];
    let mut entropy = [false; OLD_TAU];
    for i in 0..15 {
        entropy[(i * 7) % OLD_TAU] = true;
    }
    let real_noise = decrypt_noise(dk, encrypt(ek, entropy, true));
    let fake_noise = decrypt_noise(dk, BigNum::from_slice([4, 4, 6, 2, 6, 7, 4, 2, 2]));
    println(f"real_noise: {real_noise}");
    println(f"fake_noise: {fake_noise}");
}

// Maximum Cyphertext considered (integers modulo 2^1031)

type MC1031 = BigNum<9, 1032, MC1031_Params>;

struct MC1031_Params {}

impl BigNumParamsGetter<9, 1032> for MC1031_Params {
    fn get_params() -> BigNumParams<9, 1032> {
        BigNumParams {
            modulus: [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x800000000000000000],
            double_modulus: [
                0x01000000000000000000000000000000,
                0xffffffffffffffffffffffffffffff,
                0xffffffffffffffffffffffffffffff,
                0xffffffffffffffffffffffffffffff,
                0xffffffffffffffffffffffffffffff,
                0xffffffffffffffffffffffffffffff,
                0xffffffffffffffffffffffffffffff,
                0xffffffffffffffffffffffffffffff,
                0xffffffffffffffffff,
            ],
            modulus_u60: U60Repr {
                limbs: [
                    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
                    0x00, 0x00, 0x00, 0x00, 0x0800,
                ],
            },
            modulus_u60_x4: U60Repr {
                limbs: [
                    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
                    0x00, 0x00, 0x00, 0x00, 0x0800, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
                    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
                ],
            },
            redc_param: [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x20000000000000000000],
            has_multiplicative_inverse: false,
        }
    }
}

use dep::bignum::BigNum;
use dep::bignum::params::BigNumParamsGetter;
use dep::bignum::utils::u60_representation::U60Repr;

// Temporary encryption key moudulus hardcoded mock
// TODO: no need for this anymore, got parametrized away
// TODO: refactoring in progress

type AGCD = BigNum<9, 1031, AGCD_Params>;

struct AGCD_Params {}

impl BigNumParamsGetter<9, 1031> for AGCD_Params {
    fn get_params() -> BigNumParams<9, 1031> {
        BigNumParams {
            modulus: [
                0x8f7d4fcff973333634f8f8407c44fe,
                0xd4b62d4ee67a7438e22655ce50e9d9,
                0x39011824bf4cc94900ec9b93863df3,
                0xee38e34c3f9d1480b450bcd998dc13,
                0x77abc676fa9d0086cd0f914f0e4abb,
                0x3011f4b5e1bf5cbb92c36c59facbd9,
                0xaaf746a259bc2bf11795727e6e8bd1,
                0x3fb152a206053f83d5814a4103936d,
                0x7ae4e5b50cb9781d62,
            ],
            double_modulus: [
                0x011efa9f9ff2e6666c69f1f080f889fc,
                0x01a96c5a9dccf4e871c44cab9ca1d3b2,
                0x01720230497e99929201d937270c7be6,
                0x01dc71c6987f3a290168a179b331b825,
                0x01ef578cedf53a010d9a1f229e1c9576,
                0x016023e96bc37eb9772586d8b3f597b1,
                0x0155ee8d44b37857e22f2ae4fcdd17a1,
                0x017f62a5440c0a7f07ab0294820726da,
                0xf5c9cb6a1972f03ac3,
            ],
            modulus_u60: U60Repr {
                limbs: [
                    0x0634f8f8407c44fe,
                    0x08f7d4fcff973333,
                    0x08e22655ce50e9d9,
                    0x0d4b62d4ee67a743,
                    0x0900ec9b93863df3,
                    0x039011824bf4cc94,
                    0xb450bcd998dc13,
                    0x0ee38e34c3f9d148,
                    0x06cd0f914f0e4abb,
                    0x077abc676fa9d008,
                    0x0b92c36c59facbd9,
                    0x03011f4b5e1bf5cb,
                    0x011795727e6e8bd1,
                    0x0aaf746a259bc2bf,
                    0x03d5814a4103936d,
                    0x03fb152a206053f8,
                    0x04e5b50cb9781d62,
                    0x07ae,
                ],
            },
            modulus_u60_x4: U60Repr {
                limbs: [
                    0x0634f8f8407c44fe,
                    0x08f7d4fcff973333,
                    0x08e22655ce50e9d9,
                    0x0d4b62d4ee67a743,
                    0x0900ec9b93863df3,
                    0x039011824bf4cc94,
                    0xb450bcd998dc13,
                    0x0ee38e34c3f9d148,
                    0x06cd0f914f0e4abb,
                    0x077abc676fa9d008,
                    0x0b92c36c59facbd9,
                    0x03011f4b5e1bf5cb,
                    0x011795727e6e8bd1,
                    0x0aaf746a259bc2bf,
                    0x03d5814a4103936d,
                    0x03fb152a206053f8,
                    0x04e5b50cb9781d62,
                    0x07ae,
                    0x00,
                    0x00,
                    0x00,
                    0x00,
                    0x00,
                    0x00,
                    0x00,
                    0x00,
                    0x00,
                    0x00,
                    0x00,
                    0x00,
                    0x00,
                    0x00,
                    0x00,
                    0x00,
                    0x00,
                    0x00,
                ],
            },
            redc_param: [
                0x8ac761800eec119fb49f0348f6fc3d,
                0xf34e189546fcaa3e20a020c25a6e86,
                0x65b821ffd2c3cbfd9732a0d16a1244,
                0xd55569b0d17ad88fdec6dfb181d9a8,
                0x4b761279d17923f2748a70dc3b3e42,
                0xa6da6c493f7ddaf36216143da1dc17,
                0x2555678a4e1602b0ccd60a8da8b969,
                0x6183952f3d3e5aa1196d3842100ced,
                0x0855168a51fc68190411,
            ],
            has_multiplicative_inverse: false,
        }
    }
}
