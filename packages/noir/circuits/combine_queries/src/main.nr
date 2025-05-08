use std::hash::pedersen_hash as hash;

global Size: u32 = 16;
global Side: u32 = 4;

fn tile_has_trap(tile: Field) -> bool {
    tile == 0
}
fn tile_has_agent(tile: Field) -> bool {
    (tile != 0) & (tile != 1)
}

fn main(
    board_used: [Field; Size],
    board_salt: Field,
    tiles_salt: [Field; Size],
    veil_digests: pub [Field; Size],
) -> pub ([Field; Size], Field, Field) {
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

    let mut tile_digests_vec = Vec::new();
    for position in 0..Size {
        //tile_digests_vec.push(hash([tiles_used.get(position) as Field, tiles_salt[position]]))
        tile_digests_vec.push(tiles_salt[position] + tiles_used[position] as Field) // UH bug
    }
    let tile_digests = tile_digests_vec.slice.as_array();

    let board_digest = hash([board_salt, hash(board_used)]);
    let veils_digest = hash(veil_digests);

    (tile_digests, board_digest, veils_digest)
}
