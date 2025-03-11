use dep::bignum::params::BigNumParams;
use dep::bignum::RuntimeBigNum::from_array;
use std::hash::pedersen_hash;

global Size: u32 = 16;
global Limbs: u32 = 9;
global Bits: u32 = 1031;

global Tau: u32 = 1289;

global VoidRoom: Field = 0;

fn main(
    position: pub u32,
    pieces: [Field; Size],
    pieces_salt: Field,
    obfuscators: [bool; Size],
    obfuscators_salt: Field,
    selectors: pub [[Field; Limbs]; 2],
    params: pub BigNumParams<Limbs, Bits>,
    encrypt_proof: [Field; 93],
    encrypt_vk_hash: Field,
    encrypt_verification_key: [Field;114],
    encrypt_key_set: pub [[Field;Limbs]; Tau + 1],
    encrypt_message: bool,
    encrypt_results: [Field; Limbs],
) -> pub (Field, Field, [Field; Limbs]) {
    let encrypt_inputs = [];  // TODO (is it worth it?) (recursive proof generation seems slow)
    std::verify_proof(
        encrypt_verification_key,
        encrypt_proof,
        encrypt_inputs,
        encrypt_vk_hash,
    );

    assert(obfuscators[position] == encrypt_message);
    let selected = pieces[position] != VoidRoom; // Could expand to taxi_norm() <= 1 ("neighbors")
    let query = (
        from_array(params, encrypt_results) + from_array(params, selectors[selected as u32])
    )
        .limbs;

    let pieces_digest = pedersen_hash([pieces_salt, pedersen_hash(pieces)]);
    let obfuscators_digest = pedersen_hash([
        obfuscators_salt,
        pedersen_hash(obfuscators.map(|b: bool| b as Field)),
    ]);
    (pieces_digest, obfuscators_digest, query)
}
