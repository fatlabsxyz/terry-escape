rm -f modulus key.toml entropy.toml Prover.toml

python3 ../../utils/keypair_generator.py 128 2> modulus | tail -1 | sed 's/resulting_samples/key_set/' > key.toml
python3 ../../utils/entropy_generator.py $(cat key.toml | tr -c '[' ' ' | wc -w) > entropy.toml

echo message = true > Prover.toml
cat key.toml >> Prover.toml
cat entropy.toml >> Prover.toml

bash ../../utils/paramgen_output_to_prover_input.sh params $(cat modulus) >> Prover.toml
