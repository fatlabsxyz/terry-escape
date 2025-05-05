export type Field = string;
export type BigNum = Field[];
export type Secret_Key = BigNum;
export type Public_Key = { key_set: BigNum[], params: Params };
export type State = { board_used?: Field[], board_salt: Field }
export type Action = { reason: number, target: number, trap: boolean }
export type Params = { has_multiplicative_inverse: boolean, modulus: BigNum, double_modulus: string[],
	modulus_u60: { limbs: string[] }, modulus_u60_x4: { limbs: string[] }, redc_param: string[] }
