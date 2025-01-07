global SIDE = 7;
global SIZE = 49;

global TAU = 1289;

fn main() {
    state_update(
        StatesData {
            old_digest: 0x234516cb0418d397e2cdd58845d22a262854ec640bbc905e98df79b625563f7,
            new_digest: 0x2364516cb0418d397e2cdd58845d22a262854ec640bbc905e98df79b625563f7,
            old_salt: 23,
            new_salt: 23,
            old_pieces: [0; 49],
            new_pieces: [0; 49],
        },
        ObliviousTransfersData {
            encrypted_bits: [false; SIZE],
            encryption_key: [0; TAU],
            encryption_entropy: [[false; TAU]; SIZE],
            selectors: [[0, 0]; SIZE],
            responses: [[false, false]; SIZE],
        },
    );
}

struct StatesData {
    old_digest: Field,
    new_digest: Field,
    old_salt: Field,
    new_salt: Field,
    old_pieces: [Field; SIZE],
    new_pieces: [Field; SIZE],
}

type AGCD = Field;
struct ObliviousTransfersData {
    encrypted_bits: [bool; SIZE],
    encryption_key: [AGCD; TAU],
    encryption_entropy: [[bool; TAU]; SIZE],
    selectors: [[AGCD; 2]; SIZE],
    responses: [[bool; 2]; SIZE],
}

fn is_trap(piece: Field) -> bool {
    piece == 1
}

fn is_pawn(piece: Field) -> bool {
    (piece != 0) & (piece != 1)
}

fn state_update_on_response(st: StatesData, ot: ObliviousTransfersData) {
    //assert(st.old_digest == digest(st.old_pieces, st.old_salt));
    //assert(st.new_digest == digest(st.new_pieces, st.new_salt));
    for i in 0..SIZE {
        let piece = st.old_pieces[i];
        let had_piece = is_pawn(piece) | is_trap(piece);
        // Query position with own mines and submarines
        let queried = had_piece
            // And the positions neighboring submarines
            | if i > SIDE {
                is_submarine(st.old_pieces[i - SIDE])
            } else {
                false
            }
            | if i < (SIZE - SIDE) {
                is_submarine(st.old_pieces[i + SIDE])
            } else {
                false
            }
            | if (i % SIDE) > 0 {
                is_submarine(st.old_pieces[i - 1])
            } else {
                false
            }
            | if (i % SIDE) < (SIDE - 1) {
                is_submarine(st.old_pieces[i + 1])
            } else {
                false
            };

        let response = (ot.responses[i][queried as u32] != ot.encrypted_bits[i]);
        if response {
            println(f"Noise heard at position {i}");
        }
        if had_piece & !response {
            assert(st.new_pieces[i] == st.old_pieces[i]);
        } else {
            assert(st.new_pieces[i] == 0);
        }
    }
}

fn digest(pieces: [Field; SIZE], salt: Field) -> Field {
    pieces.fold(salt, |a, b| std::hash::pedersen_hash([a, b]))
}

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

fn select_received_responses(
    sent_random_bits: [bool; SIZE],
    the_queried_bits: [bool; SIZE],
    received_anwsers: [[bool; 2]; SIZE],
) -> [bool;SIZE] {
    let mut selected = [false;SIZE];
    for i in 0..SIZE {
	selected[i] = received_anwsers[i][the_queried_bits[i] as u32] ^ sent_random_bits[i];
    }
    selected
}

fn update(mut pieces: [Field; SIZE], responses: [bool; SIZE]) -> [Field; SIZE] {
    for i in 0..SIZE {
        if responses[i] {
            if pieces[i] == VOID {
                println(f"Your agents hear noise at position {i}");
            } else if pieces[i] == TRAP {
                println(f"Your trap is activated at position {i}");
            } else {
                println(f"Your agents evaporated at position {i}");
            }
            pieces[i] = VOID;
        }
    }
    pieces
}

fn digest(pieces: [Field; SIZE], salt: Field) -> Field {
    pieces.fold(salt, |a, b| std::hash::pedersen_hash([a, b]))
}

fn main(
    old_pieces: [Field; SIZE],
    old_salt: Field,
    new_salt: Field,
    reason: u32,
    target: u32,
    trap: bool,
) -> pub (Field, Field) {
    let new_pieces = update(old_pieces, reason, target, trap);
    let old_digest = digest(old_pieces, old_salt);
    let new_digest = digest(new_pieces, new_salt);
    println(new_pieces);
    println(new_digest);
    (old_digest, new_digest)
}

