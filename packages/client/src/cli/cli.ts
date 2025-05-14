import { ZkLibMock } from "../client/zklib-mock.js";
import { ZkLib } from "zklib";
import { GameClient } from "./../client/game/gameclient.js";
import { Board } from "./../client/game/board.js";

import { SocketManager } from "./../client/sockets/socketManager.js";
import { getAuthToken, AuthRequestData } from "./../utils.js";
import { IJ } from "../types/game.js";

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
    
    const zklib = new ZkLib();
    // const zklib = new ZkLibMock();

    const client = new GameClient(sockets.token, sockets, zklib);

    // submit agent coordinates to game and start playing
    await client.play(mockAddAgents(client));

    // client.takeAction();
    // take action continues if the player submits a valid action before 30s

    } else {
      console.log("Could not get user token from gamemaster in /auth")
  } 
}

initCli().catch((e) => {
  console.error(e);
  process.exit(1);
});

export function mockAddAgents(client: GameClient) {
    // create board after player index is known
  const index = client.initialPlayerIndex;
  const board = new Board(index);
  
  console.log(`CLI: ALLOWED LOCS FOR INDEX (${index}):${board.computeAllowedPlacements()}`);
  
  let agents: IJ[];
  if (index % 2 === 0) {
    agents = [board.allowedPlacements[0], board.allowedPlacements[0], board.allowedPlacements[0], board.allowedPlacements[0]];
  } else {
    agents = [board.allowedPlacements[3], board.allowedPlacements[3], board.allowedPlacements[3], board.allowedPlacements[3]];
  }
  console.log("CLI: AGENTS:", agents);
  return board.addAgents({agents});
}
