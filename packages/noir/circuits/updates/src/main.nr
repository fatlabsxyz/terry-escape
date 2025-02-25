use dep::bignum::BigNum;
use cheon_stehle::AGCD;
use std::hash::pedersen_hash;

global TAU = 1289;

global SIZE = 16;
global PLAYERS = 4;

global TRAP = 0;
global VOID = 1;

fn main(
    mut pieces: [Field; SIZE],
    old_salt: Field,
    new_salt: Field,
    encryption_key: [[Field; 9]; TAU],
    obfuscators: [bool; SIZE],
    queries: pub [[Field; 9]; SIZE],
    selectors: pub [[[Field; 9]; 2]; SIZE],
    responses: [[bool; 2]; SIZE],
) -> pub (Field, Field, AGCD) {
    // TODO: recursive refactoring WIP, valite responses proofs and extract responses from public inputs
    
    let old_digest = pedersen_hash([old_salt, pedersen_hash(pieces)]);

    // TODO: hits = responses[pieces,queries]-obfuscators; pieces -= hits; report <- hits
    
    print(pieces);
    let new_digest = pedersen_hash([new_salt, pedersen_hash(pieces)]);

    (old_digest, new_digest, /*mock*/ BigNum::from_slice(encryption_key[0]))
}
