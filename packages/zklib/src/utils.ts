import crypto from 'crypto';

import {
  answers_updates_json,
  blinded_answers_json,
  combine_queries_json,
  initial_deploys_json,
  offline_queries_json,
  reports_updates_json
} from 'noir/circuits';

  interface Artifact {
    noir_version: string;
    hash: number;
    abi: object;
    bytecode: string;
    debug_symbols: string;
    file_map: object;
    names: string[];
    brilling_names: string[];
  }

const Grumpkin_field_order = "0x30644e72e131a029b85045b68181585d2833e84879b9709143e1f593f0000001";

export function random_Field() {
  let bytes = Array.from(crypto.getRandomValues(new Uint8Array(32)));
  bytes[0]! %= 0x40;
  const hex = "0x" + bytes.map(byte => byte.toString(16).padStart(2, "0")).join("");
  if (hex < Grumpkin_field_order) { return hex; } else { return random_Field(); }
};

export function random_bool() { return Math.random() < 0.5; };  // TODO: Is Math.random() secure?

/****************/

// https://noir-lang.org/docs/tutorials/noirjs_app#some-more-js

import initACVM from "@noir-lang/acvm_js";
import initNoirC from "@noir-lang/noirc_abi";
// import acvm from "@noir-lang/acvm_js/web/acvm_js_bg.wasm?url";
// import noirc from "@noir-lang/noirc_abi/web/noirc_abi_wasm_bg.wasm?url";
// await Promise.all([initACVM(fetch(acvm)), initNoirC(fetch(noirc))]);

/****************/

import { abiEncode, Abi } from '@noir-lang/noirc_abi';
import { ProofData, UltraHonkBackend } from '@aztec/bb.js';
import { Noir } from '@noir-lang/noir_js';
import { BigNum } from './types.js';

interface Circuit {
  abi: Abi,
  noir: Noir,
  backend: UltraHonkBackend
}

type CircuitType = "initial_deploys"
    | "offline_queries"
    | "combine_queries"
    | "blinded_answers"
    | "answers_updates"
    | "reports_updates";


export function init_circuits() : Record<CircuitType, Circuit> {
  const from_json = function(json: Artifact) {
    const { bytecode, abi } = json;
    return {
      abi: abi as Abi,
      noir: new Noir({ bytecode, abi: abi as Abi }),
      backend: new UltraHonkBackend(bytecode, { threads: 8 })
    };
  };

  return {
    "initial_deploys": from_json(initial_deploys_json as any as Artifact),
    "offline_queries": from_json(offline_queries_json as any as Artifact),
    "combine_queries": from_json(combine_queries_json as any as Artifact),
    "blinded_answers": from_json(blinded_answers_json as any as Artifact),
    "answers_updates": from_json(answers_updates_json as any as Artifact),
    "reports_updates": from_json(reports_updates_json as any as Artifact),
  };
};

export async function generate_proof(circuit: Circuit, inputs: any, options: { mockProof: boolean } = { mockProof: false }) {
  let computed_board = undefined;
  let informed_detect = undefined;
  const oracle_handler = async (name: string, _inputs: any) => {
    if (name == "oracle_board") { computed_board = _inputs[0]; }
    if (name == "oracle_detect") { informed_detect = _inputs[0]; }
    return [];
  };
  const { witness, returnValue } = await circuit.noir.execute(inputs, oracle_handler);
  
  const publicAbi = {...circuit.abi, parameters: circuit.abi.parameters.filter(p => p.visibility == 'public') }
  let publicInputs = [...abiEncode(publicAbi, inputs).values()];
  publicInputs = publicInputs.concat([returnValue].flat(3).map(v => "0x"+BigInt(v as string).toString(16).padStart(64,'0')));
  let payload : ProofData = { proof: new Uint8Array(), publicInputs }
  
  if (!options.mockProof) {
    payload = await circuit.backend.generateProof(witness);
    console.assert(JSON.stringify(payload.publicInputs) == JSON.stringify(publicInputs));
  }
  
  const private_outputs = { computed_board, informed_detect };
  return { payload, private_outputs, returnValue };
}

export async function verify_proof(circuit: Circuit, proof: ProofData) {
  const validity = await circuit.backend.verifyProof(proof);
  if (!validity) { throw Error("Proof verification failed!"); }
  return proof.publicInputs;
}


///////////////////////////////

function to_big_int(big_num : BigNum) : bigint {
	return BigInt('0x'+big_num.map(limb => limb.slice(2).slice(-30).padStart(30,'0')).reverse().join(''));
}
function to_big_num(n : bigint) : BigNum {
	let limbs = [];
	while (n > 0) {
		limbs.push('0x'+(n % (2n**120n)).toString(16));
		n /= (2n**120n);
	}
	while (limbs.length < 9) { limbs.push('0x0'); }
	return limbs;
}

export function selector(key_set: BigNum[], entropy: boolean[], message: boolean) : BigNum {
	let sum = key_set.slice(1).map(to_big_int).filter((_,i) => entropy[i]).reduce((a,b) => a+b);
	if (message) { sum += to_big_int(key_set[1]!)/BigInt(2); }
	return to_big_num((sum % to_big_int(key_set[0]!)) / (2n**512n));
}

export function bits(n : number) : boolean[] {
	let result = [];
	while (n > 0) { result.push(n%2 == 0); n = Math.floor(n/2); }
	result.length = 8;
	return Array.from(result, bit => bit ?? false);
}
