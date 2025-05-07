import { describe, expect, it, vi, beforeEach } from "vitest";

import { ZkLib } from "../../src/zklib.js";

import { publicKeySample, secretKeySample } from '../../../keypairs/src/data/index.js';

/// ALICIA (ACTIVE PLAYER)
const zkAlicia = new ZkLib(0, secretKeySample(0), [publicKeySample(0), publicKeySample(1)], { mockProof: true });
/// BRENDA
const zkBrenda = new ZkLib(1, secretKeySample(1), [publicKeySample(0), publicKeySample(1)], { mockProof: true });

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
  const { playerProofs: answerProof } = await zkAlicia.createAnswers([queryProof], action);
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

