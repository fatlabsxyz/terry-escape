import { GameClient } from "./game/gameclient.js";
import { SocketManager } from "./sockets/socketManager.js";
import { getAuthToken } from "./../utils.js";


export async function getNewToken(name: string, url: string) { 
  const token = await getAuthToken({name, url});
      return token || null;
}

export async function connect(token: string, url: string, gameId: string) {
  const sockets = new SocketManager({
    serverUrl: url,
    token: token,
    gameId: gameId, 
  });

  await sockets.socketsReady();

  const client = new GameClient(sockets.token, sockets);

  await client.play();
}
