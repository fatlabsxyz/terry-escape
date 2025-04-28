import { ZklibMock } from "../client/zklib-mock.js";
import { GameClient } from "./../client/game/gameclient.js";
import { SocketManager } from "./../client/sockets/socketManager.js";
import { getAuthToken, AuthRequestData } from "./../utils.js";

import { zklib } from "zklib";

type Field = string;
type BigNum = Field[];
type Secret_Key = BigNum;
type Public_Key = { key_set: BigNum[], params: any };

const args = process.argv.splice(2)

export function passTime(ms: number): Promise<void> {
  return new Promise((res, rej) => {
    setTimeout(res, ms)
  })
}

export function testZkLib() {
  const privkey: Secret_Key = ["test", "test"];
  const pubkeyNum: BigNum = ["testpub", "testpub"];
  const pubkey: Public_Key = { key_set: [pubkeyNum], params: null };
  const zklibber: zklib = new zklib(0, privkey, [pubkey]);

  console.log(zklibber);
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
