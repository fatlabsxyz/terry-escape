scrapped=$(bash ~/aztec-grant-pss/utils/paramgen_scrapper.sh $1)

echo '{'
echo '"has_multiplicative_inverse": false,'
echo '"modulus":' $(echo "$scrapped" | sed "1q;d"),
echo '"redc_param":' $(echo "$scrapped" | sed "2q;d"),
echo '"double_modulus":' $(echo "$scrapped" | sed "3q;d"),
echo '"modulus_u60": { "limbs":' $(echo "$scrapped" | sed "4q;d") },
echo '"modulus_u60_x4": { "limbs":' $(echo "$scrapped" | sed "5q;d") }
echo '}'
