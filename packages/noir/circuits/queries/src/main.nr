use dep::bignum::RuntimeBigNum;
use std::hash::pedersen_hash;

// TODO: compute and hardcode vk
global encrypt_vk: [Field; 114] = [123456789; 114];
global encrypt_vk_hash: Field = 123456789;

global Size: u32 = 16;
global Limbs: u32 = 9;
global Bits: u32 = 1031;

global VoidRoom: Field = 0;

fn main(
    pieces: [Field; Size],
    salt: Field,
    encrypt_proofs: [[Field; 93]; Size],
    params: dep::bignum::params::BigNumParams<Limbs, Bits>,
    encryption_key_hash: pub Field,
    encrypted_obfuscators: [bool; Size],
    resulting_ciphertexts: [[Field; Limbs]; Size],
    selectors: pub [[[Field; Limbs]; 2]; Size],
) -> pub (Field, [[Field;Limbs]; Size]) {
    // Verify valid obfuscators encryption
    for i in 0..Size {
        let public_inputs = [0]; // TODO : pack {params, ek_hash, obfuscators[i], ciphertexts[i]}
        /*std::verify_proof(
            encrypt_vk,
            encrypt_proofs[i],
            public_inputs,
            encrypt_vk_hash,
        );*/
    }

    let mut queries = [[0;Limbs]; Size];
    for i in 0..Size {
        let selected = pieces[i] != VoidRoom; // Could expand to taxi_norm() <= 1 ("neighbors")
        queries[i] = (RuntimeBigNum::from_array(params, resulting_ciphertexts[i])
            + RuntimeBigNum::from_array(params, selectors[i][selected as u32])).limbs;
    }

    let digest = pedersen_hash([salt, pedersen_hash(pieces)]);
    (digest, queries)
}
