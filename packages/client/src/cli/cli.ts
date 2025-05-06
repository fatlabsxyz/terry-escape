import { ZklibMock } from "../client/zklib-mock.js";
import { GameClient } from "./../client/game/gameclient.js";
import { SocketManager } from "./../client/sockets/socketManager.js";
import { getAuthToken, AuthRequestData } from "./../utils.js";



// -- that's all thanks -- //
const args = process.argv.splice(2)

export function passTime(ms: number): Promise<void> {
  return new Promise((res, rej) => {
    setTimeout(res, ms)
  })
}

export async function initCli() {
    
  // testZkLib();
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
