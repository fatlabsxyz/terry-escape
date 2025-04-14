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
  const url = args[0]!;
  const data: AuthRequestData = { name: args[1]!, url: url };
  const newToken = await getAuthToken(data);

  if (newToken) {
    const sockets = new SocketManager({
      serverUrl: url,
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

