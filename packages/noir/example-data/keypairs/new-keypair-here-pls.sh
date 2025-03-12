lambda=$1
python3 ~/aztec-grant-pss/utils/keypair_generator.py $1
bash ~/aztec-grant-pss/utils/paramgen_to_json.sh $(cat modulus) > params.json
