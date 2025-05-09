lambda=$1
python3 ~/aztec-grant-pss/packages/noir/utils/keypair_generator.py $1
bash ~/aztec-grant-pss/packages/noir/utils/paramgen_to_json.sh $(cat modulus) > params.json
