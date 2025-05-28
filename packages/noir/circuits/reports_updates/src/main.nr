use bignum::params::BigNumParams;
use bignum::RuntimeBigNum::from_array;
use cheon_stehle::decrypt;
use std::hash::pedersen_hash as hash;

global Players: u32 = 4;
global Size: u32 = 16;
global Limbs: u32 = 9;
global Bits: u32 = 1031;

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
    reason: u32,
    target: u32,
    trap: bool,
    action_salt: Field,
    params: pub BigNumParams<Limbs, Bits>,
    decryption_key: [Field; Limbs],
    hit_reports: pub [[Field; Limbs]; Players - 1],
) -> pub (Field, Field, Field, bool, Field) {
    let old_board_digest = hash([old_board_salt, hash(board_used)]);
    let action_digest = hash(
        [action_salt, reason as Field, target as Field, trap as Field],
    );

    let decryption_key_digest = hash(decryption_key);
    let dk = from_array(params, decryption_key);
    let detect = hit_reports.any(|encrypted_report| {
        decrypt(dk, from_array(params, encrypted_report))
    })
        | (trap & tile_has_agent(board_used[target]))
        | tile_has_trap(board_used[target]);

    if trap {
        board_used[target] = 0; // Trap
    } else {
        board_used[reason] -= 1; // Decrement agents
        board_used[target] += 1; // Increment agents
    }
    if detect {
        board_used[target] = 1; // Void tile
        let _ = unsafe { output_detect(target) };
    }

    let _ = unsafe { output_board(board_used) };
    let new_board_digest = hash([new_board_salt, hash(board_used)]);
    let ded = board_used.all(|v| (v == 0) | (v == 1));

    (old_board_digest, new_board_digest, action_digest, ded, decryption_key_digest)
}
