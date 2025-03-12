rm -rf target

time nargo compile
time nargo execute

here=$(pwd | tr '/' '\n' | tail -1)
time bb prove_ultra_honk -b ./target/$here.json -w ./target/$here.gz -o ./target/proof
time bb write_vk_ultra_honk -b ./target/$here.json -o ./target/vk
time bb verify_ultra_honk -k ./target/vk -p ./target/proof
