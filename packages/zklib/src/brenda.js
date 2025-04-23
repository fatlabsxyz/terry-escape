import { zklib } from "./zklib.ts";

import alicia_params from '../../example-data/keypairs/alicia/params.json';
import { key_set as alicia_key_set } from '../../example-data/keypairs/alicia/encryption_key.json';
const alicia_public_key = { key_set: alicia_key_set, params: alicia_params }

import brenda_params from '../../example-data/keypairs/brenda/params.json';
import { key_set as brenda_key_set } from '../../example-data/keypairs/brenda/encryption_key.json';
const brenda_public_key = { key_set: brenda_key_set, params: brenda_params }

import { decryption_key } from '../../example-data/keypairs/brenda/decryption_key.json';
decryption_key.push("0");

const zk = new zklib(1, decryption_key, [alicia_public_key, brenda_public_key]);

addEventListener('message', async event => {
	if (event.data == 'genesis') {
		postMessage({ stage: 'deploys', payload: await zk.createDeploys([1,1,1,1]) });
	}
	if (event.data.stage == 'deploys') {
		zk.verifyDeploys([event.data.payload]);
		await new Promise(r => setTimeout(r, 10_000));
		postMessage({ stage: 'queries', payload: await zk.createQueries(0) });
	}
	if (event.data.stage == 'answers') {
		postMessage({ stage: 'updates', payload: (await zk.createUpdates(event.data.payload.proof[0], 0)).proof });
	}
	if (event.data.stage == 'reports') {
		// Vefify reports
	}
});
