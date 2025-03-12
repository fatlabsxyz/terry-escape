use bignum::params::BigNumParams;
use bignum::RuntimeBigNum::from_array;
use cheon_stehle::decrypt;
use std::hash::pedersen_hash as hash;

global Limbs: u32 = 9;
global Bits: u32 = 1031;

global Side: u32 = 4;
global Size: u32 = 16;

fn taxi_norm(tile_a: u32, tile_b: u32) -> u32 {
    assert(Side * Side == Size);
    let ax = tile_a % Side;
    let ay = tile_a / Side;
    let bx = tile_b % Side;
    let by = tile_b / Side;
    let dx = if (ax > bx) { ax - bx } else { bx - ax };
    let dy = if (ay > by) { ay - by } else { by - ay };
    dx + dy
}

fn tile_has_agent(tile: Field) -> bool {
    (tile != 0) & (tile != 1)
}

fn main(
    board_used: [Field; Size],
    board_salt: Field,
    reason: u32,
    target: u32,
    trap: bool,
    action_salt: Field,
    params: pub BigNumParams<Limbs, Bits>,
    decryption_key: [Field; Limbs],
    queries: pub [[Field; Limbs]; Size],
    selectors: pub [[[Field; Limbs]; 2]; Size],
) -> pub (Field, Field, Field, [[bool; 2]; Size]) {
    let board_digest = hash([board_salt, hash(board_used)]);
    let action_digest = hash(
        [action_salt, reason as Field, target as Field, trap as Field],
    );
    let decryption_key_digest = hash(decryption_key);

    let mut responses = [[false; 2]; Size];
    let dk = from_array(params, decryption_key);
    for position in 0..Size {
        let query_made = from_array(params, queries[position]);
        let selector_0 = from_array(params, selectors[position][0]);
        let selector_1 = from_array(params, selectors[position][1]);
        responses[position][0] = decrypt(dk, query_made - selector_0);
        responses[position][1] = decrypt(dk, query_made - selector_1);
    }
    responses[target][1] ^= true;

    assert(tile_has_agent(board_used[reason]));
    assert(taxi_norm(reason, target) <= 1);

    (board_digest, action_digest, decryption_key_digest, responses)
}
