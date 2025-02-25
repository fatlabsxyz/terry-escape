use std::hash::pedersen_hash;

global SIZE: u32 = 16;

global VOID: Field = 1;

fn main(player: pub u8, agents: [Field; 4], salt: Field) -> pub Field {
    assert(SIZE == 16);
    assert(player < 4);
    assert(agents.reduce(|a, b| a + b) == 4);
    let mut pieces = [VOID; SIZE];
    let anchor = 0 + (player % 2) + 4 * (player / 2);
    pieces[anchor + 0 + 0] += agents[0];
    pieces[anchor + 0 + 2] += agents[1];
    pieces[anchor + 8 + 0] += agents[2];
    pieces[anchor + 8 + 2] += agents[3];
    let digest = pedersen_hash([salt, pedersen_hash(pieces)]);
    println(pieces);
    digest
}

