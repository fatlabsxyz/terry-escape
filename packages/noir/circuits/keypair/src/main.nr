global Tau: u32 = 1289;
// TODO: could parametrize dependent on security parameter (using comptime calculations)

fn main(
    common_divisor: [Field; 8],
    scaling_factors: [[Field; 2]; Tau+1],
    additive_noises: [[Field; 2]; Tau+1],
    resulting_samples: pub [[Field; 9]; Tau+1],
) -> pub Field {
    dep::cheon_stehle::validate_keypair(
        common_divisor,
        scaling_factors,
        additive_noises,
        resulting_samples,
    );
    std::hash::pedersen_hash(common_divisor)
}
