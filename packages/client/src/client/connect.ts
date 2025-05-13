import { GameClient } from "./game/gameclient.js";
import { SocketManager } from "./sockets/socketManager.js";
import { getAuthToken } from "./../utils.js";
import { ZkLibMock } from "./zklib-mock.js";
import { ZkLib } from "zklib";
import { mockAddAgents } from "./../cli/cli.js";

export const FRONTEND_URLS = ['http://localhost:8000'];

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


  // const zklib = new ZkLib();
  const zklib = new ZkLibMock();

  const client = new GameClient(sockets.token, sockets, zklib);

  await client.play(mockAddAgents(client));
}

