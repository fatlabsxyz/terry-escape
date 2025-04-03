use std::hash::pedersen_hash as hash;

global Size: u32 = 16;

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
    let mut tiles_used = Vec::new();
    for position in 0..Size {
        tiles_used.push(tile_has_agent(board_used[position]) | tile_has_trap(board_used[position]));
        // TODO: also query for tiles that neighbors an agent
    }

    let mut tile_digests_vec = Vec::new();
    for position in 0..Size {
        tile_digests_vec.push(hash([tiles_used.get(position) as Field, tiles_salt[position]]))
    }
    let tile_digests = tile_digests_vec.slice.as_array();

    let board_digest = hash([board_salt, hash(board_used)]);
    let veils_digest = hash(veil_digests);

    (tile_digests, board_digest, veils_digest)
}
