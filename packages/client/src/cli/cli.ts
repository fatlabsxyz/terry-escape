import { ZklibMock } from "../client/zklib-mock.js";
import { GameClient } from "./../client/game/gameclient.js";
import { Board } from "./../client/game/board.js";
import { SocketManager } from "./../client/sockets/socketManager.js";
import { getAuthToken, AuthRequestData } from "./../utils.js";

const args = process.argv.splice(2)

export function passTime(ms: number): Promise<void> {
  return new Promise((res, rej) => {
    setTimeout(res, ms)
  })
}

export async function initCli() {
    
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
    
    // create board
    const client = new GameClient(sockets.token, sockets, ZklibMock.newMock());
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

    const coordinates = board.addAgents(agents);
    await client.play(coordinates);
  } else {
    console.log("Could not get user token from gamemaster in /auth")
  } 
}

initCli().catch((e) => {
  console.error(e);
  process.exit(1);
});
