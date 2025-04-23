import { describe, expect, it, vi, beforeEach } from "vitest";

import { zklib } from "../../src/zklib.js";

import alicia_params from '../../example-data/keypairs/alicia/params.json';
import { key_set as alicia_key_set } from '../../example-data/keypairs/alicia/encryption_key.json';
const alicia_public_key = { key_set: alicia_key_set, params: alicia_params }

import brenda_params from '../../example-data/keypairs/brenda/params.json';
import { key_set as brenda_key_set } from '../../example-data/keypairs/brenda/encryption_key.json';
const brenda_public_key = { key_set: brenda_key_set, params: brenda_params }

import { decryption_key as brenda_decryption_key } from '../../example-data/keypairs/brenda/decryption_key.json';
import { decryption_key as alicia_decryption_key } from '../../example-data/keypairs/alicia/decryption_key.json';

/// ALICIA (ACTIVE PLAYER)
const zkAlicia = new zklib(0, [...alicia_decryption_key, "0"], [alicia_public_key, brenda_public_key]);

/// BRENDA
const zkBrenda = new zklib(1, [...brenda_decryption_key, "0"], [alicia_public_key, brenda_public_key]);

async function flow() {

  const aliciaDeploy = await zkAlicia.createDeploys([0, 0, 0, 4]);
  const brendaDeploy = await zkBrenda.createDeploys([1, 1, 1, 1]);

  zkAlicia.verifyDeploys([brendaDeploy.proof]);
  zkBrenda.verifyDeploys([aliciaDeploy.proof]);
  console.log("verified deploys")

  // brenda queries alicia
  const { proof: queryProof } = await zkBrenda.createQueries(0);
  console.log("queryProof", queryProof)

  // alicia creates answers using queries
  const action = { reason: 10, target: 9, trap: true };
  const { proof: answerProof } = await zkAlicia.createAnswers([queryProof], action);
  console.log("answerProof", answerProof)

  // brenda updates her state with potential collsion
  const { proof: updateProof } = await zkBrenda.createUpdates(answerProof[0], 0);
  console.log("updateProof", updateProof)

  // alicia creates proofs that she used everyones input
  const { proof: reportProof } = await zkAlicia.createReports([updateProof, updateProof, updateProof]);
  console.log("reportProof", reportProof)

  return 1;

}

describe("Full flow 2 users", () => {
  it("Runs with no issues", async () => {
    const r = await flow();
    expect(r).toEqual(1)
  })
})

