use std::hash::pedersen_hash;
use dep::bignum::BigNum;
use cheon_stehle::AGCD;

global SIZE = 16;
global PLAYERS = 4;

global TRAP = 0;
global VOID = 1;

fn main(
    mut pieces: [Field; SIZE],
    old_salt: Field,
    new_salt: Field,
    reason: u32,
    target: u32,
    trap: bool,
    decryption_key: [Field; 8],
    hit_reports: [AGCD; PLAYERS],
) -> pub (Field, Field, Field, Field) {
    // TODO : recursive refactoring WIP, validate update proofs, extract report from public inputs
    
    let old_digest = pedersen_hash([old_salt, pedersen_hash(pieces)]);
    let action_hash = pedersen_hash([reason as Field, target as Field, trap as Field]);
    let dk_hash = pedersen_hash(decryption_key);
    let did_hit = hit_reports.any(|c| cheon_stehle::decrypt(c, BigNum::from_slice(decryption_key)));

    if trap {
        pieces[target] = if (pieces[target] == VOID) { TRAP } else { VOID };
    } else {
        pieces[reason] -= 1;
        pieces[target] += 1;
    }
    if did_hit {
        pieces[target] = VOID;
    }

    print(pieces);
    let new_digest = pedersen_hash([new_salt, pedersen_hash(pieces)]);

    (old_digest, new_digest, action_hash, dk_hash)
}

