// https://noir-lang.org/docs/tutorials/noirjs_app#some-more-js

import initNoirC from "@noir-lang/noirc_abi";
import initACVM from "@noir-lang/acvm_js";
import acvm from "@noir-lang/acvm_js/web/acvm_js_bg.wasm?url";
import noirc from "@noir-lang/noirc_abi/web/noirc_abi_wasm_bg.wasm?url";
await Promise.all([initACVM(fetch(acvm)), initNoirC(fetch(noirc))]);

/****************/

import { Noir } from '@noir-lang/noir_js';
import { UltraHonkBackend, UltraPlonkBackend } from '@aztec/bb.js';

//import keypair_json from '../circuits/keypair/target/keypair.json' assert { type: 'json' };
import initial_deploys_json from '../circuits/initial_deploys/target/initial_deploys.json' assert { type: 'json' };
//import offline_queries_json from '../circuits/offline_queries/target/offline_queries.json' assert { type: 'json' };
import combine_queries_json from '../circuits/combine_queries/target/combine_queries.json' assert { type: 'json' };
import blinded_answers_json from '../circuits/blinded_answers/target/blinded_answers.json' assert { type: 'json' };
import answers_updates_json from '../circuits/answers_updates/target/answers_updates.json' assert { type: 'json' };
import reports_updates_json from '../circuits/reports_updates/target/reports_updates.json' assert { type: 'json' };

function set_up_circuit(json) {
	return {
		noir: new Noir(json),
		backend: new UltraHonkBackend(json.bytecode, { threads: 8 }) 
	}
}

const stages = {
//	'keypair' : set_up_circuit(keypair_json),
	"initial_deploys" : set_up_circuit(initial_deploys_json),
//	"offline_queries" : set_up_circuit(offline_queries_json),
	"combine_queries" : set_up_circuit(combine_queries_json),
	"blinded_answers" : set_up_circuit(blinded_answers_json),
	"answers_updates" : set_up_circuit(answers_updates_json),
	"reports_updates" : set_up_circuit(reports_updates_json),
};
//stages["offline_queries"].backend = new UltraPlonkBackend(offline_queries_json.bytecode, { threads: 8 });  // UH bug?

async function generate_proof(circuit, inputs) {
	let computed_board = null;
	let informed_detect = null;
	const oracle_handler = async (name, inputs) => {
		if (name == "oracle_board") { computed_board = inputs[0]; }
		if (name == "oracle_detect") { informed_detect = inputs[0]; }
		return [];
	};
        
	console.log("Generating trace ...");
	const { witness } = await stages[circuit].noir.execute(inputs, oracle_handler);
	console.log("Generating proof ...");
	const payload = await stages[circuit].backend.generateProof(witness);
	const private_outputs = { computed_board, informed_detect };
	console.log("Verifiying proof ...");
	console.assert(await stages[circuit].backend.verifyProof(payload));
	console.log(" ");
	
	return { payload, private_outputs };
}

//function timestamp() { console.log(new Date().toLocaleString()); }

const Grumpkin_field_order = "0x30644e72e131a029b85045b68181585d2833e84879b9709143e1f593f0000001";
const random_Field = function() {
	let bytes = Array.from(crypto.getRandomValues(new Uint8Array(32)));
	bytes[0] %= 0x40;
	const hex = "0x"+bytes.map(byte => byte.toString(16).padStart(2,0)).join("");
	if (hex < Grumpkin_field_order) { return hex; } else { return random_Field(); }
};
const random_bool = function() { return Math.random() < 0.5; };  // TODO: Is Math.random() secure?

/****************/

console.log("Circuit: initial_deploys (mover player)");

const mover_initial_deploys_inputs = {
	player: 0,
	agents:[0,0,0,4],
	board_salt: random_Field()
};

const mover_initial_deploys_result = await generate_proof('initial_deploys', mover_initial_deploys_inputs);

/****************/

console.log("Circuit: initial_deploys (other player)");

const other_initial_deploys_inputs = {
	player: 1,
	agents:[1,1,1,1],
	board_salt: random_Field()
};

const other_initial_deploys_result = await generate_proof('initial_deploys', other_initial_deploys_inputs);

/****************/

console.log("Circuit: offline_queries (other player)");

const worker = new Worker("offline-queries-worker.js", { type: "module" });
await new Promise(r => setTimeout(r, 2_000));  // TODO: this "waits" for worker initialization, change to real wait

import params from '../example-data/keypairs/alicia/params.json';
import encryption_key from '../example-data/keypairs/alicia/encryption_key.json';
const key_set = encryption_key.list;
const key = { params, key_set };

const tiles_used = other_initial_deploys_result.private_outputs.computed_board.map(tile => (tile != 1));
const selectors_MOCK = Array.from(Array(16), () => [[1,2,3,4,5,6,7,8,9],[9,8,7,6,5,4,3,2,1]]);
worker.postMessage({ command: 'set_target_keys', params: [ key, key, key ] });
worker.postMessage({ command: 'store_selectors', params: { key, selectors: selectors_MOCK } });
worker.postMessage({ command: 'retrieve_proofs', params: { key, tiles_used } }); 


/*
// Precomputing usage example
worker.postMessage({ command: 'store_selectors', params: { key, selectors: selectors_MOCK } });
worker.postMessage({ command: 'start' });
await new Promise(r => setTimeout(r, 180_000));
worker.postMessage({ command: 'pause' });
worker.postMessage({ command: 'retrieve_proofs', params: { key, tiles_used: tiles_used_MOCK} });
*/


let offline_queries_results = await new Promise(resolve => {
	worker.addEventListener("message", event => {
		console.log("Received proofs from worker:");
		console.log(event.data);
		resolve(event.data);
	});
});


/****************/

console.log("Circuit: combine_queries (other player)");

const other_board_used = other_initial_deploys_result.private_outputs.computed_board;
const other_board_salt = other_initial_deploys_inputs.board_salt;

const tiles_salt = offline_queries_results.map(({proof, publicInputs}) => publicInputs[1]);
const veil_digests = offline_queries_results.map(({proof, publicInputs}) => publicInputs.slice(-10,-9)[0]);

const combine_queries_inputs = {
	board_used: other_board_used,
	board_salt: other_board_salt,
	tiles_salt,
	veil_digests,
};

const combine_queries_result = await generate_proof('combine_queries', combine_queries_inputs);

/****************/

const Size = 16;

console.log("Circuit: blinded_answers (mover player)");

import dec_key from '../example-data/keypairs/alicia/decryption_key.json' assert { type: 'json' };
const decryption_key = dec_key.list.concat([0]);
const blinded_answers_inputs = {
	board_used: mover_initial_deploys_result.private_outputs.computed_board,
	board_salt: mover_initial_deploys_inputs.board_salt,
	reason: 10,
	target: 9,
	trap: true,
	action_salt: random_Field(),
	params,
	decryption_key,
	queries: offline_queries_results.map(({proof, publicInputs}) => publicInputs.slice(-9)),
	selectors: selectors_MOCK
};
const blinded_answers_result = await generate_proof('blinded_answers', blinded_answers_inputs);
const responses = blinded_answers_result.payload.publicInputs.slice(-32);

/****************/

const Tau = 1289;

console.log("Circuit: answers_updates (other player)");
const answers_updates_inputs = {
	board_used: other_initial_deploys_result.private_outputs.computed_board,
	old_board_salt: other_initial_deploys_inputs.board_salt,
	new_board_salt: random_Field(),
	action_salt: random_Field(),
	params,
	key_set,
	entropy: Array.from(Array(Tau+1), () => Math.random() < 0.5),  // TODO: secure randomness
	veils_used: offline_queries_results.map(({proof, publicInputs, inputs}) => inputs.veil_used),
	veils_salt: offline_queries_results.map(({proof, publicInputs, inputs}) => inputs.veil_salt),
	responses,
};
const answers_updates_result = await generate_proof('answers_updates', answers_updates_inputs);
const hit_report = answers_updates_result.payload.publicInputs.slice(-9);

/****************/

console.log("Circuit: reports_updates (mover player)");

const reports_updates_inputs = {
	board_used: blinded_answers_inputs.board_used,
	old_board_salt: blinded_answers_inputs.board_salt,
	new_board_salt: random_Field(),
	reason: blinded_answers_inputs.reason,
	target: blinded_answers_inputs.target,
	trap: blinded_answers_inputs.trap,
	action_salt: blinded_answers_inputs.action_salt,
	params,
	decryption_key,
	hit_reports: [hit_report, hit_report, hit_report],  // Real, mock, mock
};
const reports_updates_result = await generate_proof('reports_updates', reports_updates_inputs);

/****************/

console.log("tuki")
