scrapped=$(bash ~/aztec-grant-pss/utils/paramgen_scrapper.sh $2)

echo [$1]
echo has_multiplicative_inverse = false
echo modulus = $(echo "$scrapped" | sed "1q;d")
echo redc_param = $(echo "$scrapped" | sed "2q;d")
echo double_modulus = $(echo "$scrapped" | sed "3q;d")
echo
echo [$1.modulus_u60]
echo limbs = $(echo "$scrapped" | sed "4q;d")
echo
echo [$1.modulus_u60_x4]
echo limbs = $(echo "$scrapped" | sed "5q;d")
