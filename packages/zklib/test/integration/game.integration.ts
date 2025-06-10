import { describe, expect, it } from "vitest";

import { ZkLib } from "../../src/zklib.js";

import { publicKeySample, secretKeySample } from '../../../keypairs/src/data/index.js';

const zklibs = [0,1,2,3].map(_ => new ZkLib());
[0,1,2,3].map(i => zklibs[i].setup(i, secretKeySample(i), [0,1,2,3].map(publicKeySample)));

async function run_turn(mover: number, action: { reason: number, target: number, trap: boolean }) {
  let others = [0,1,2,3].filter(i => i != mover);
  
  let queries = await Promise.all(others.map(i => zklibs[i].createQueries(mover)));
  console.log(new Date(), "Computed queries");

  let answers = await zklibs[mover].createAnswers(queries.map(q => q.proof), action);
  console.log(new Date(), "Computed answers");

  let updates = await Promise.all(others.map((p,i) => zklibs[p].createUpdates(answers.playerProofs[i], mover)));
  console.log(new Date(), "Computed updates");

  let reports = await zklibs[mover].createReports(updates.map(u => u.proof));
  console.log(new Date(), "Computed reports");

  await Promise.all([0,1,2,3].map(i => zklibs[i].verifyForeign(queries.map(q => q.proof), answers.playerProofs, updates.map(u => u.proof), reports.proof, mover, i == 0)));
  console.log(new Date(), "Verified foreign");

  let detect = Array(4); let ded = Array(4);
  for (let i = 0; i < 4; i++) {
    if (i == mover) {
      ded[i] = reports.died;
      if (reports.impacted) { detect[i] = action.target }
    } else {
      ded[i] = updates[i-Number(mover<=i)].died;
      detect[i] = updates[i-Number(mover<=i)].collision;
    }
  }
  return { detect, ded }
}

async function game() { 
  const deploys = await Promise.all([0,1,2,3].map(i => zklibs[i].createDeploys([4,0,0,0])));
  console.log(new Date(), "Computed deploys");
  
  zklibs.map(z => z.verifyDeploys(deploys.map(d => d.proof)));
  console.log(new Date(), "Verified deploys");

  console.log(await run_turn(0, { reason: 0, target: 1, trap: false }), new Date());
  console.log(await run_turn(2, { reason: 4, target: 0, trap: true }), new Date());
  console.log(await run_turn(3, { reason: 5, target: 4, trap: false }), new Date());

  return 1;
}

describe("Full turn 4 users", () => {
  it("Runs with no issues", async () => {
    const r = await game();
    expect(r).toEqual(1)
  })
})

