import { GameClient } from "./game/gameclient.js";
import { SocketManager } from "./sockets/socketManager.js";
import { getAuthToken } from "./../utils.js";
import { ZklibMock } from "./zklib-mock.js";
import { Board } from "./game/board.js";

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

  const client = new GameClient(sockets.token, sockets, ZklibMock.newMock());

  await client.play();
  // await client.play(mockAddAgents(client));
}

function mockAddAgents(client: GameClient) {
    const board = new Board(client.playerIndex);
    const allowedCoordinates = board.allowedPlacements();
    const agents = {
      agents: [
        {
          row: allowedCoordinates.a.row, 
          column: allowedCoordinates.a.col,
        }, {
          row: allowedCoordinates.b.row, 
          column: allowedCoordinates.b.row
        }, {
          row: allowedCoordinates.c.row, 
          column: allowedCoordinates.c.row
        }, {
          row: allowedCoordinates.d.row, 
          column: allowedCoordinates.d.row
        }
      ]};

    return board.addAgents(agents);
}
