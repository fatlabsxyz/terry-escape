lambda=$1

mkdir -p example_details ; cd example_details
python3 ~/aztec-grant-pss/utils/keypair_generator.py $lambda

echo common_divisor = $(cat decryption_key) > ../Prover.toml
echo additive_noises = $(cat additive_noises) >> ../Prover.toml
echo scaling_factors = $(cat scaling_factors) >> ../Prover.toml
echo resulting_samples = $(cat encryption_key) >> ../Prover.toml
