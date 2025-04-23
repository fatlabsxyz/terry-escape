const Grumpkin_field_order = "0x30644e72e131a029b85045b68181585d2833e84879b9709143e1f593f0000001";

export function random_Field() {
	let bytes = Array.from(crypto.getRandomValues(new Uint8Array(32)));
	bytes[0] %= 0x40;
	const hex = "0x"+bytes.map(byte => byte.toString(16).padStart(2,0)).join("");
	if (hex < Grumpkin_field_order) { return hex; } else { return random_Field(); }
};

export function random_bool() { return Math.random() < 0.5; };  // TODO: Is Math.random() secure?

/****************/

// https://noir-lang.org/docs/tutorials/noirjs_app#some-more-js

import initNoirC from "@noir-lang/noirc_abi";
import initACVM from "@noir-lang/acvm_js";
import acvm from "@noir-lang/acvm_js/web/acvm_js_bg.wasm?url";
import noirc from "@noir-lang/noirc_abi/web/noirc_abi_wasm_bg.wasm?url";
await Promise.all([initACVM(fetch(acvm)), initNoirC(fetch(noirc))]);

/****************/

import { Noir } from '@noir-lang/noir_js';
import { UltraHonkBackend, UltraPlonkBackend } from '@aztec/bb.js';

export async function init_circuits() {
	const from_json = function(json) {
		return {
			noir: new Noir(json),
			backend: new UltraHonkBackend(json.bytecode, { threads: 8 })
		};
	};

	return {
		"initial_deploys" : from_json(await import ("../../circuits/initial_deploys/target/initial_deploys.json")),
		"offline_queries" : from_json(await import ("../../circuits/offline_queries/target/offline_queries.json")),
		"combine_queries" : from_json(await import ("../../circuits/combine_queries/target/combine_queries.json")),
		"blinded_answers" : from_json(await import ("../../circuits/blinded_answers/target/blinded_answers.json")),
		"answers_updates" : from_json(await import ("../../circuits/answers_updates/target/answers_updates.json")),
		"reports_updates" : from_json(await import ("../../circuits/reports_updates/target/reports_updates.json")),
	};
};

export async function generate_proof(circuit, inputs) {
	let computed_board = null;
	let informed_detect = null;
	const oracle_handler = async (name, inputs) => {
		if (name == "oracle_board") { computed_board = inputs[0]; }
		if (name == "oracle_detect") { informed_detect = inputs[0]; }
		return [];
	};

	const { witness, returnValue } = await circuit.noir.execute(inputs, oracle_handler);
	const payload = await circuit.backend.generateProof(witness);
	const private_outputs = { computed_board, informed_detect };
	return { payload, private_outputs, returnValue };
}

export async function verify_proof(circuit, proof) {
	const validity = await circuit.backend.verifyProof(proof);
	if (!validity) { await verification_failed_halt(); }
	postMessage("Verified isolated proof");
	return proof.publicInputs;
}

export async function verification_failed_halt() {
	postMessage("Verification failed!");
	await new Promise(() => {});
}
