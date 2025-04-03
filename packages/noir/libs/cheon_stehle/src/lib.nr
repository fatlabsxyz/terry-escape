use dep::bignum::{params::BigNumParams, RuntimeBigNum};

pub fn encrypt<let Tau: u32, let Num: u32, let Bits: u32>(
    params: BigNumParams<Num, Bits>,
    key_set: [[Field; Num]; Tau],
    entropy: [bool; Tau],
    message: bool,
) -> RuntimeBigNum<Num, Bits> {
    let mut terms = Vec::new();
    for i in 0..Tau {
        terms.push(
            if entropy[i] {
                RuntimeBigNum::from_array(params, key_set[i])
            } else {
                RuntimeBigNum::new(params)
            }
        );
    }
    let mut sum = unsafe { terms.slice.reduce(|sum, next| sum.__add(next)) };

    let mut flags = [false; Tau + 1];
    flags[Tau] = true;
    terms.push(sum);

    RuntimeBigNum::evaluate_quadratic_expression(
        params,
        [[]; 0],
        [[]; 0],
        [[]; 0],
        [[]; 0],
        terms.slice.as_array(),
        flags,
    );

    if message {
        let _1 = RuntimeBigNum::one(params);
        let _2 = _1 + _1;
        sum += RuntimeBigNum::from_array(params, key_set[0]).udiv(_2);
    }
    sum
}

pub fn decrypt<let Limbs: u32, let Bits: u32>(
    decryption_key: RuntimeBigNum<Limbs, Bits>,
    ciphertext: RuntimeBigNum<Limbs, Bits>,
) -> bool {
    let _1 = RuntimeBigNum::one(ciphertext.params);
    let _2 = _1 + _1;

    let k = decryption_key;
    let c = ciphertext;

    // round_nearest(2*c/k)%2 == 1
    (c.udiv(k) * _2 + (k.udiv(_2) + c.umod(k) * _2).udiv(k)).umod(_2) == _1
}

#[test]
fn test_encrypt_decrypt() {
    let dec_key_limbs = [1, 4, 2, 8, 5, 7, 0, 0, 0];
    let dec_key = RuntimeBigNum::from_array(MC1031_params, dec_key_limbs);
    let enc_key = [dec_key_limbs; 1289 + 1];
    let mut entropy = [false; 1289 + 1];
    for i in 0..123 {
        entropy[(i * 456) % 1289 + 1] = true;
    }

    assert(decrypt(dec_key, encrypt(MC1031_params, enc_key, entropy, true)) == true);
    assert(decrypt(dec_key, encrypt(MC1031_params, enc_key, entropy, false)) == false);
}

/* Old implementations using BigNums fixed since compile time */
// TODO: cleaning up and refactoring in progress

/*
fn decrypt_noise(p: AGCD, c: AGCD) -> AGCD {
    let _1: AGCD = BigNum::one();
    let _2 = _1 + _1;

    // ~ c%(p/2)
    c.umod(p.udiv(_2))
}



// (Harcoded for security parameter=128)
pub fn validate_keypair<let Tau: u32>(
    common_divisor_entropy: [Field; 8],
    multiplier_entropy: [[Field; 2]; Tau + 1],
    additive_entropy: [[Field; 2]; Tau + 1],
    resulting_samples: [[Field; 9]; Tau + 1],
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

    for i in 0..Tau + 1 {
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
*/

/*
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
*/

// Maximum Cyphertext considered (integers modulo 2^1031)
global MC1031_params: BigNumParams<9, 1031> = BigNumParams {
    modulus: [
        0xffffffffffffffffffffffffffffff,
        0xffffffffffffffffffffffffffffff,
        0xffffffffffffffffffffffffffffff,
        0xffffffffffffffffffffffffffffff,
        0xffffffffffffffffffffffffffffff,
        0xffffffffffffffffffffffffffffff,
        0xffffffffffffffffffffffffffffff,
        0xffffffffffffffffffffffffffffff,
        0x7fffffffffffffffff,
    ],
    double_modulus: [
        0x01fffffffffffffffffffffffffffffe,
        0x01fffffffffffffffffffffffffffffe,
        0x01fffffffffffffffffffffffffffffe,
        0x01fffffffffffffffffffffffffffffe,
        0x01fffffffffffffffffffffffffffffe,
        0x01fffffffffffffffffffffffffffffe,
        0x01fffffffffffffffffffffffffffffe,
        0x01fffffffffffffffffffffffffffffe,
        0xfffffffffffffffffe,
    ],
    modulus_u60: U60Repr {
        limbs: [
            0x0fffffffffffffff,
            0x0fffffffffffffff,
            0x0fffffffffffffff,
            0x0fffffffffffffff,
            0x0fffffffffffffff,
            0x0fffffffffffffff,
            0x0fffffffffffffff,
            0x0fffffffffffffff,
            0x0fffffffffffffff,
            0x0fffffffffffffff,
            0x0fffffffffffffff,
            0x0fffffffffffffff,
            0x0fffffffffffffff,
            0x0fffffffffffffff,
            0x0fffffffffffffff,
            0x0fffffffffffffff,
            0x0fffffffffffffff,
            0x07ff,
        ],
    },
    modulus_u60_x4: U60Repr {
        limbs: [
            0x0fffffffffffffff,
            0x0fffffffffffffff,
            0x0fffffffffffffff,
            0x0fffffffffffffff,
            0x0fffffffffffffff,
            0x0fffffffffffffff,
            0x0fffffffffffffff,
            0x0fffffffffffffff,
            0x0fffffffffffffff,
            0x0fffffffffffffff,
            0x0fffffffffffffff,
            0x0fffffffffffffff,
            0x0fffffffffffffff,
            0x0fffffffffffffff,
            0x0fffffffffffffff,
            0x0fffffffffffffff,
            0x0fffffffffffffff,
            0x07ff,
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
    redc_param: [0x10, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x08000000000000000000],
    has_multiplicative_inverse: false,
};
use dep::bignum::utils::u60_representation::U60Repr;
