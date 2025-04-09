import { GameClient } from "./game/gameclient.js";
import { SocketManager } from "./sockets/socketManager.js";
import { getAuthToken, AuthRequestData } from "./../utils.js";

const args = process.argv.splice(2)

function passTime(ms: number): Promise<void> {
  return new Promise((res, rej) => {
    setTimeout(res, ms)
  })
}

async function initClient() {

  const data: AuthRequestData = { name: args[1]! };
  const newToken = await getAuthToken(data);

  if (newToken) {
    const sockets = new SocketManager({
      serverUrl: args[0]!,
      token: newToken,
      gameId: args[2]!,
    });

    await sockets.socketsReady();

    const client = new GameClient(sockets.token, sockets);

    await client.play();
  } else {
    console.log("Could not get user token from gamemaster in /auth")
  } 
}

initClient().catch((e) => {
  console.error(e);
  process.exit(1);
});

