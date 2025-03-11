computed=$(~/.cargo/bin/paramgen instance $1)

formatted=$(\
echo [$(echo "$computed" | sed "22q;d") ]
echo [$(echo "$computed" | sed "32q;d") ]
echo [$(echo "$computed" | sed "25q;d") ]
echo [$(echo "$computed" | sed "28q;d" | head -c -4) ]
echo [$(echo "$computed" | sed "30q;d" | head -c -5) ]
)

echo "$formatted" | sed 's/\(0x[0-9a-f]*\)/"\1"/g'
