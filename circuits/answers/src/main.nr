use dep::bignum::BigNum;
use cheon_stehle;
use cheon_stehle::AGCD;
use std::hash::pedersen_hash;

global SIDE = 4;
global SIZE = 16;

fn taxi_norm(tile_a: u32, tile_b: u32) -> u32 {
    assert(SIDE * SIDE == SIZE);
    let ax = tile_a % SIDE;
    let ay = tile_a / SIDE;
    let bx = tile_b % SIDE;
    let by = tile_b / SIDE;
    let dx = if (ax > bx) { ax - bx } else { bx - ax };
    let dy = if (ay > by) { ay - by } else { by - ay };
    dx + dy
}

global TRAP = 0;
global VOID = 1;

fn main(
    pieces: [Field; SIZE],
    salt: Field,
    reason: u32,
    target: u32,
    trap: bool,
    decryption_key: [Field; 8],
    queries: pub [[Field; 9]; SIZE],
    selectors: pub [[[Field; 9]; 2]; SIZE],
) -> pub (Field, Field, Field, [[bool; 2]; SIZE]) {
    // TODO: recursive refactoring WIP, valite queries proofs and extract selectors from public inputs

    let digest = pedersen_hash([salt, pedersen_hash(pieces)]);
    let action_hash = pedersen_hash([reason as Field, target as Field, trap as Field]);
    let dk_hash = pedersen_hash(decryption_key);

    let mut responses = [[false; 2]; SIZE];
    let dk: AGCD = BigNum::from_slice(decryption_key);
    for i in 0..SIZE {
        let ct: AGCD = BigNum::from_slice(queries[i]);
        let s0: AGCD = BigNum::from_slice(selectors[i][0]);
        let s1: AGCD = BigNum::from_slice(selectors[i][1]);
        responses[i][0] = cheon_stehle::decrypt(dk, ct - s0);
        responses[i][1] = cheon_stehle::decrypt(dk, ct - s1);
    }
    responses[target][1] ^= true;

    assert(pieces[reason] != VOID);
    assert(pieces[reason] != TRAP);
    assert(taxi_norm(reason, target) <= 1);

    (digest, action_hash, dk_hash, responses)
}

