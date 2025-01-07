global Limbs: u32 = 9;
global Bits: u32 = 1031;
global Tau: u32 = 1289;

fn main(
    params: dep::bignum::params::BigNumParams<Limbs, Bits>,
    key_set: [[Field; Limbs]; Tau],
    entropy: [bool; Tau],
    message: bool,
) {
    dep::cheon_stehle::encrypt_p(params, key_set, entropy, message);
}
