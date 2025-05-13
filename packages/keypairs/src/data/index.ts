import pk_00 from "./keypair-00/encryption_key.json" with { type: "json" }
import pk_01 from "./keypair-01/encryption_key.json" with { type: "json" }
import pk_02 from "./keypair-02/encryption_key.json" with { type: "json" }
import pk_03 from "./keypair-03/encryption_key.json" with { type: "json" }
import pk_04 from "./keypair-04/encryption_key.json" with { type: "json" }
import pk_05 from "./keypair-05/encryption_key.json" with { type: "json" }
import pk_06 from "./keypair-06/encryption_key.json" with { type: "json" }
import pk_07 from "./keypair-07/encryption_key.json" with { type: "json" }
import pk_08 from "./keypair-08/encryption_key.json" with { type: "json" }
import pk_09 from "./keypair-09/encryption_key.json" with { type: "json" }
import pk_10 from "./keypair-10/encryption_key.json" with { type: "json" }
import pk_11 from "./keypair-11/encryption_key.json" with { type: "json" }

import ps_00 from "./keypair-00/params.json" with { type: "json" }
import ps_01 from "./keypair-01/params.json" with { type: "json" }
import ps_02 from "./keypair-02/params.json" with { type: "json" }
import ps_03 from "./keypair-03/params.json" with { type: "json" }
import ps_04 from "./keypair-04/params.json" with { type: "json" }
import ps_05 from "./keypair-05/params.json" with { type: "json" }
import ps_06 from "./keypair-06/params.json" with { type: "json" }
import ps_07 from "./keypair-07/params.json" with { type: "json" }
import ps_08 from "./keypair-08/params.json" with { type: "json" }
import ps_09 from "./keypair-09/params.json" with { type: "json" }
import ps_10 from "./keypair-10/params.json" with { type: "json" }
import ps_11 from "./keypair-11/params.json" with { type: "json" }

import dk_00 from "./keypair-00/decryption_key.json" with { type: "json" }
import dk_01 from "./keypair-01/decryption_key.json" with { type: "json" }
import dk_02 from "./keypair-02/decryption_key.json" with { type: "json" }
import dk_03 from "./keypair-03/decryption_key.json" with { type: "json" }
import dk_04 from "./keypair-04/decryption_key.json" with { type: "json" }
import dk_05 from "./keypair-05/decryption_key.json" with { type: "json" }
import dk_06 from "./keypair-06/decryption_key.json" with { type: "json" }
import dk_07 from "./keypair-07/decryption_key.json" with { type: "json" }
import dk_08 from "./keypair-08/decryption_key.json" with { type: "json" }
import dk_09 from "./keypair-09/decryption_key.json" with { type: "json" }
import dk_10 from "./keypair-10/decryption_key.json" with { type: "json" }
import dk_11 from "./keypair-11/decryption_key.json" with { type: "json" }

export type Field = string;
export type BigNum = Field[];
export type Secret_Key = BigNum;
export type Public_Key = { key_set: BigNum[], params: Params };
export type Params = { has_multiplicative_inverse: boolean, modulus: BigNum, double_modulus: string[],
	modulus_u60: { limbs: string[] }, modulus_u60_x4: { limbs: string[] }, redc_param: string[] }

export const pks = [ pk_00, pk_01, pk_02, pk_03, pk_04, pk_05, pk_06, pk_07, pk_08, pk_09, pk_10, pk_11 ];
export const pss = [ ps_00, ps_01, ps_02, ps_03, ps_04, ps_05, ps_06, ps_07, ps_08, ps_09, ps_10, ps_11 ];
export const dks = [ dk_00, dk_01, dk_02, dk_03, dk_04, dk_05, dk_06, dk_07, dk_08, dk_09, dk_10, dk_11 ];

export const POOL_SIZE = pks.length;

export function publicKeySample(id: number) : Public_Key {
  if (! (id < POOL_SIZE)) throw Error(`key index out of bounds (${id} >= ${POOL_SIZE})`);
  return { key_set: pks[id]!, params: pss[id]! }
}

export function secretKeySample(id: number) : Secret_Key {
  if (! (id < POOL_SIZE)) throw Error(`key index out of bounds (${id} >= ${POOL_SIZE})`);
  const dk = dks[id]!;
  dk.push("0");
  return dk;
}
