import { readFileSync } from 'fs';
import { Noir } from '@noir-lang/noir_js';
import { UltraHonkBackend } from '@aztec/bb.js';

import circuit from '../../circuits/keypair/target/keypair.json' assert { type: 'json' };

const noir = new Noir(circuit);
const backend = new UltraHonkBackend(circuit.bytecode, { threads: 8 });

// Input example
const common_divisor = JSON.parse(readFileSync('../../example-data/keypairs/alicia/decryption_key')) 
const scaling_factors = JSON.parse(readFileSync('../../example-data/keypairs/alicia/scaling_factors')) 
const additive_noises = JSON.parse(readFileSync('../../example-data/keypairs/alicia/additive_noises')) 
const resulting_samples = JSON.parse(readFileSync('../../example-data/keypairs/alicia/encryption_key')) 

const inputs = { common_divisor, scaling_factors, additive_noises, resulting_samples };

console.log("Executing ...");
const { witness } = await noir.execute(inputs);
console.log(witness);

console.log("Proving ...");
const { proof, publicInputs } = await backend.generateProof(witness);
console.log(proof);

console.log("tuki")
