import { zklib } from "./zklib.ts";

import alicia_params from '../../example-data/keypairs/alicia/params.json';
import { key_set as alicia_key_set } from '../../example-data/keypairs/alicia/encryption_key.json';
const alicia_public_key = { key_set: alicia_key_set, params: alicia_params }

import brenda_params from '../../example-data/keypairs/brenda/params.json';
import { key_set as brenda_key_set } from '../../example-data/keypairs/brenda/encryption_key.json';
const brenda_public_key = { key_set: brenda_key_set, params: brenda_params }

import { decryption_key } from '../../example-data/keypairs/alicia/decryption_key.json';

const zk = new zklib(0, decryption_key, [alicia_public_key, brenda_public_key]);

addEventListener('message', async event => {
	if (event.data == 'genesis') {
		postMessage({ stage: 'deploys', payload: await zk.createDeploys([0,0,0,4]) });
	}
	if (event.data.stage == 'deploys') {
		zk.verifyDeploys([event.data.payload]);
	}
	if (event.data.stage == 'queries') {
		const action = { reason: 14, target: 15, trap: true };
		postMessage({ stage: 'answers', payload: await zk.createAnswers([event.data.payload], action) });
	}
	if (event.data.stage == 'updates') {
		postMessage({ stage: 'reports', payload: undefined /*await zk.createReports([event.data.payload])*/ });
	}
});
