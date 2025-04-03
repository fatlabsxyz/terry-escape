import { GameClient } from "./game/gameclient.js";
import { SocketManager } from "./sockets/socketManager.js";

const args = process.argv.splice(2)

function passTime(ms: number): Promise<void> {
  return new Promise((res, rej) => {
    setTimeout(res, ms)
  })
}


async function initClient() {
  const sockets = new SocketManager({
    serverUrl: args[0]!,
    token: args[1]!,
    gameId: args[2]!,
  });

  await sockets.socketsReady();

  const client = new GameClient(sockets.token, sockets);

  await client.play();

}

initClient().catch((e) => {
  console.error(e);
  process.exit(1);
});

