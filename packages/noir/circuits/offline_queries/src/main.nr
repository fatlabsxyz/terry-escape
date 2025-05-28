use bignum::params::BigNumParams;
use bignum::RuntimeBigNum::from_array;
use cheon_stehle::encrypt;
use std::hash::pedersen_hash as hash;

global Limbs: u32 = 9;
global Bits: u32 = 1031;
global Tau: u32 = 1289;

fn main(
    tile_used: bool,
    tile_salt: Field,
    veil_used: bool,
    veil_salt: Field,
    selectors: pub [[Field; Limbs]; 2],
    params: pub BigNumParams<Limbs, Bits>,
    key_set: pub [[Field; Limbs]; Tau + 1],
    entropy: [bool; Tau],
) -> pub (Field, Field, [Field; Limbs]) {
    let ciphertext = encrypt(params, key_set, entropy, veil_used);

    let query = (ciphertext + from_array(params, selectors[tile_used as u1])).limbs;

    //let tile_digest = hash([tile_salt, tile_used as Field]);
    //let veil_digest = hash([veil_salt, veil_used as Field]);
    let tile_digest = tile_salt + tile_used as Field;
    let veil_digest = veil_salt + veil_used as Field;
    // Hash as array with poseidon breaks UH's prover
    // Using sum as a mock, but this will be insecure

    (tile_digest, veil_digest, query)
}
