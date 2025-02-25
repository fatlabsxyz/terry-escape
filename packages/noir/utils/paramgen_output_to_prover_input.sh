computed=$(~/.cargo/bin/paramgen instance $2)

formatted=$(\
echo [$1]
echo has_multiplicative_inverse = false
echo modulus = [$(echo "$computed" | sed "22q;d") ]
echo redc_param = [$(echo "$computed" | sed "32q;d") ]
echo double_modulus = [$(echo "$computed" | sed "25q;d") ]
echo
echo [$1.modulus_u60]
echo limbs = [$(echo "$computed" | sed "28q;d" | head -c -4) ]
echo
echo [$1.modulus_u60_x4]
echo limbs = [$(echo "$computed" | sed "30q;d" | head -c -5) ]
)

echo "$formatted" | sed 's/\(0x[0-9a-f]*\)/"\1"/g'
