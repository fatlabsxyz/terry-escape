use bignum::params::BigNumParams;
use cheon_stehle::encrypt;
use std::hash::pedersen_hash as hash;

global Size: u32 = 16;
global Side: u32 = 4;
global Limbs: u32 = 9;
global Bits: u32 = 1031;
global Tau: u32 = 1289;

fn tile_has_trap(tile: Field) -> bool {
    tile == 0
}
fn tile_has_agent(tile: Field) -> bool {
    (tile != 0) & (tile != 1)
}

#[oracle(oracle_board)]
unconstrained fn oracle_board(board: [Field; Size]) -> () {}
unconstrained fn output_board(board: [Field; Size]) -> () {
    oracle_board(board);
}
#[oracle(oracle_detect)]
unconstrained fn oracle_detect(detect: u32) -> () {}
unconstrained fn output_detect(detect: u32) -> () {
    oracle_detect(detect);
}

fn main(
    mut board_used: [Field; Size],
    old_board_salt: Field,
    new_board_salt: Field,
    params: pub BigNumParams<Limbs, Bits>,
    key_set: pub [[Field; Limbs]; Tau + 1],
    entropy: [bool; Tau],
    veils_used: [bool; Size],
    veils_salt: [Field; Size],
    responses: [bool; 2 * Size],
) -> pub (Field, Field, [Field; Size], [Field; Limbs]) {
    let old_board_digest = hash([old_board_salt, hash(board_used)]);

    let mut tiles_used = [false; Size];
    for i in 0..Size {
        tiles_used[i] = tile_has_agent(board_used[i]) | tile_has_trap(board_used[i]);
        if (i > 0) {
            tiles_used[i] |= tile_has_agent(board_used[i - 1]);
        }
        if (i != Size - 1) {
            tiles_used[i] |= (i % 4 != 3) & tile_has_agent(board_used[i + 1]);
        }
        if (i >= Side) {
            tiles_used[i] |= tile_has_agent(board_used[i - Side]);
        }
        if (i < Size - Side) {
            tiles_used[i] |= tile_has_agent(board_used[i + Side]);
        }
    }

    let mut veil_digests_vec = Vec::new();
    for position in 0..Size {
        veil_digests_vec.push(veils_used[position] as Field + veils_salt[position]);
    }
    let veil_digests = veil_digests_vec.slice.as_array();

    let mut got_hit = false;
    for position in 0..Size {
        if responses[position * 2 + tiles_used[position] as u32] != veils_used[position] {
            got_hit = tile_has_agent(board_used[position]) | tile_has_trap(board_used[position]);
            board_used[position] = 1; // Void tile
            let _ = unsafe { output_detect(position) };
        }
    }

    let encrypted_report = encrypt(params, key_set, entropy, got_hit).limbs;

    let _ = unsafe { output_board(board_used) };
    let new_board_digest = hash([new_board_salt, hash(board_used)]);

    (old_board_digest, new_board_digest, veil_digests, encrypted_report)
}
