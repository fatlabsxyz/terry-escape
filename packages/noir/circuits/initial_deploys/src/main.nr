use std::hash::pedersen_hash as hash;

global Size: u32 = 16;

#[oracle(oracle_board)]
unconstrained fn oracle_board(board: [Field; Size]) -> () {}
unconstrained fn output_board(board: [Field; Size]) -> () {
    oracle_board(board);
}

fn main(player: pub u8, agents: [Field; 4], board_salt: Field) -> pub Field {
    assert(Size == 16);
    assert(player < 4);
    assert(agents.reduce(|a, b| a + b) == 4);
    let mut board = [1 /*Empty*/; Size];
    let anchor = 0 + (player % 2) + 4 * (player / 2);
    board[anchor + 0 + 0] += agents[0];
    board[anchor + 0 + 2] += agents[1];
    board[anchor + 8 + 0] += agents[2];
    board[anchor + 8 + 2] += agents[3];
    let board_digest = hash([board_salt, hash(board)]);
    let _ = unsafe { output_board(board); };
    board_digest
}

