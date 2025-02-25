global Tau: u32 = 1289;

fn main(
    common_divisor_entropy: [Field; 8],
    multiplier_entropy: [[Field; 2]; Tau],
    additive_entropy: [[Field; 2]; Tau],
    resulting_samples: pub [[Field; 9]; Tau],
) -> pub Field {
    dep::cheon_stehle::validate_keypair(
        common_divisor_entropy,
        multiplier_entropy,
        additive_entropy,
        resulting_samples,
    );
    std::hash::pedersen_hash(common_divisor_entropy)
}
