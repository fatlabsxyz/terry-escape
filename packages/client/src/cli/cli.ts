import { ZklibMock } from "../client/zklib-mock.js";
import { GameClient } from "./../client/game/gameclient.js";
import { SocketManager } from "./../client/sockets/socketManager.js";
import { getAuthToken, AuthRequestData } from "./../utils.js";

import { zklib } from "zklib";

import alicia_params from './example-data/keypairs/alicia/params.json' with { type: "json" };
import alicia_keys from './example-data/keypairs/alicia/encryption_key.json' with { type: "json" };

const alicia_key_set = alicia_keys.key_set;
const alicia_public_key = { key_set: alicia_key_set , params: alicia_params }

import brenda_params from './example-data/keypairs/brenda/params.json' with { type: "json" };
import brenda_keys from './example-data/keypairs/brenda/encryption_key.json' with { type: "json" };


const brenda_key_set = brenda_keys.key_set;
const brenda_public_key = { key_set: brenda_key_set, params: brenda_params }

import brenda_decryption_keys from './example-data/keypairs/brenda/decryption_key.json' with { type: "json" };
import alicia_decryption_keys from './example-data/keypairs/alicia/decryption_key.json' with { type: "json" };

const alicia_decryption_key = alicia_decryption_keys.decryption_key;
const brenda_decryption_key = brenda_decryption_keys.decryption_key;

const args = process.argv.splice(2)

export function passTime(ms: number): Promise<void> {
  return new Promise((res, rej) => {
    setTimeout(res, ms)
  })
}

export async function testZkLib() {

  /// ALICIA (ACTIVE PLAYER)
  const zkAlicia = new zklib(0, [...alicia_decryption_key, "0"], [alicia_public_key, brenda_public_key]);

  /// BRENDA
  const zkBrenda = new zklib(1, [...brenda_decryption_key, "0"], [alicia_public_key, brenda_public_key]);


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
  const { proof: updateProof } = await zkBrenda.createUpdates(answerProof[0]!, 0);
  console.log("updateProof", updateProof)

  // alicia creates proofs that she used everyones input
  const { proof: reportProof } = await zkAlicia.createReports([updateProof, updateProof, updateProof]);
  console.log("reportProof", reportProof)
}

export async function initCli() {
    
  testZkLib();
  const url = args[0]!;
  const name = args[1]!;
  const gameId = args[2]!;


  const data: AuthRequestData = { name: name, url: url };
  const newToken = await getAuthToken(data);

  if (newToken) {
    const sockets = new SocketManager({
      serverUrl: url,
      token: newToken,
      gameId: gameId, 
    });

    await sockets.socketsReady();

    const client = new GameClient(sockets.token, sockets, ZklibMock.newMock());

    await client.play();
  } else {
    console.log("Could not get user token from gamemaster in /auth")
  } 
}

initCli().catch((e) => {
  console.error(e);
  process.exit(1);
});
