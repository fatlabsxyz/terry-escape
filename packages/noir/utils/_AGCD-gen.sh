echo "
use dep::bignum::BigNum;
use dep::bignum::params::{BigNumParams, BigNumParamsGetter};
use dep::bignum::utils::u60_representation::U60Repr;

type AGCD = BigNum<9, 1031, AGCD_Params>;

struct AGCD_Params {}

impl BigNumParamsGetter<9, 1031> for AGCD_Params {
    fn get_params() -> BigNumParams<9, 1031> {
        BigNumParams {
"

~/.cargo/bin/paramgen instance $1 | tail -n +21 | head -n -2

echo ", has_multiplicative_inverse: false }}}"

