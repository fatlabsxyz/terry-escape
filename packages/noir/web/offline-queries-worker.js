// https://noir-lang.org/docs/tutorials/noirjs_app#some-more-js

import initNoirC from "@noir-lang/noirc_abi";
import initACVM from "@noir-lang/acvm_js";
import acvm from "@noir-lang/acvm_js/web/acvm_js_bg.wasm?url";
import noirc from "@noir-lang/noirc_abi/web/noirc_abi_wasm_bg.wasm?url";
await Promise.all([initACVM(fetch(acvm)), initNoirC(fetch(noirc))]);

/****************/

import { Noir } from '@noir-lang/noir_js';
import { UltraHonkBackend } from '@aztec/bb.js';

import circuit_json from '../circuits/offline_queries/target/offline_queries.json';
const noir = new Noir(circuit_json);
const backend = new UltraHonkBackend(circuit_json.bytecode, { threads: 8 }) 

const Tau = 1289;

const random_bool = function() { return Math.random() < 0.5; };  // TODO: Is Math.random() secure?

const Grumpkin_field_order = "0x30644e72e131a029b85045b68181585d2833e84879b9709143e1f593f0000001";
const random_Field = function() {
	let bytes = Array.from(crypto.getRandomValues(new Uint8Array(32)));
	bytes[0] %= 0x40;
	const hex = "0x"+bytes.map(byte => byte.toString(16).padStart(2,0)).join("");
	if (hex < Grumpkin_field_order) { return hex; } else { return random_Field(); }
};

function generate_proof(key, tile_used, selectors) {
	return new Promise(async (resolve, reject) => {
		console.log("Generating proof:");
		const inputs = {
			tile_used,
			tile_salt: random_Field(),
			veil_used: random_bool(),
			veil_salt: random_Field(),
			selectors,
			params: key.params,
			key_set: key.key_set,
			entropy: Array.from(Array(Tau+1), random_bool)
		};
		const { witness } = await noir.execute(inputs);
		const { proof, publicInputs } = await backend.generateProof(witness);
		console.log("Proof DONE");
		resolve({ proof, publicInputs, inputs });
	});
}


/****************/

let enabled = false;
let target_keys = [];
let selectors_queues = {};
let generated_proofs = {};
let proof_todo_queue = [];

addEventListener("message", (event) => {
	console.log("Worker: command requested", event.data);
	if (event.data.command == "pause") { enabled = false; }
	if (event.data.command == "start") { enabled = true; }
	if (event.data.command == "set_target_keys") { set_target_keys(event.data.params); }
	if (event.data.command == "store_selectors") { store_selectors(event.data.params); }
	if (event.data.command == "rotate_priority") { target_keys.push(target_keys.shift()); }
	if (event.data.command == "retrieve_proofs") { retrieve_proofs(event.data.params); }
	start();
});

function set_target_keys(keys) {
	target_keys = keys;
	keys.forEach(key => generated_proofs[key] ||= []);
	keys.forEach(key => selectors_queues[key] ||= []);
}

function store_selectors({key, selectors}) {
	selectors_queues[key].push(selectors);
	generated_proofs[key].push(selectors.map(() => ({ true: null, false: null })));
}

async function retrieve_proofs({key, tiles_used}) {
	let available = generated_proofs[key].shift();
	let selectors = selectors_queues[key].shift();
	let responses = [];
	for (let i = 0; i < 16; i++) {
		let tile_used = tiles_used[i];
		let index = i;
		responses.push(await (available[index][tile_used] || generate_proof(key, tile_used, selectors[index])));
	}
	postMessage(responses);
}

async function start() {
	if (!enabled) { return; }
	for (let turns = 0; true; turns++) {
		let keys = target_keys.filter(key => selectors_queues[key].length > turns);
		if (keys.length == 0) { return; }
		for (let ik = 0; ik < keys.length; ik++) {
			let turn_proofs = generated_proofs[keys[ik]][turns];
			for (let i = 0; i < turn_proofs.length; i++) {
				if (!turn_proofs[i][true] || !turn_proofs[i][false]) {
				let positive = generate_proof(keys[ik], true,  selectors_queues[keys[ik]][turns][i]);
				let negative = generate_proof(keys[ik], false, selectors_queues[keys[ik]][turns][i]);
				generated_proofs[keys[ik]][turns][i] = { true: positive, false: negative };
				await Promise.all([positive, negative]).then(start);
				return;
				}
			}
		}
	}
}
