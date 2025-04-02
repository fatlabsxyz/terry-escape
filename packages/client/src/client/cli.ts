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
    name: args[1]!,
    gameId: args[2]!,
    token: "testtoken"
  });

  await sockets.socketsReady();

  const client = new GameClient(args[1]!, sockets);

  await client.play();

  // if (args[1] === "Bartolomeo") {
  //   await passTime(3_000);
  //   await sockets.broadcastTurnEnd();
  // } else {
  //   await sockets.waitForTurnEndEvent();
  // }

}

initClient().catch((e) => {
  console.error(e);
  process.exit(1);
});

