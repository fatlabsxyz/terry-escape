import { GameClient } from "./game/gameclient.js";
import { SocketManager } from "./sockets/socketManager.js";
import { getAuthToken } from "./../utils.js";
import { ZkLibMock } from "./zklib-mock.js";
import { ZkLib } from "zklib";
import { Connection, IfEvents, Impacts, Interfacer, Turn } from "./interfacer.js";
import { Board } from "./game/board.js";
import { IJ, Player, PlayerSeat } from "../types/game.js";

export const FRONTEND_URLS = ['http://localhost:8000'];

export async function getNewToken(name: string, url: string) { 
  const token = await getAuthToken({name, url});
      return token || null;
}

export async function connect(token: string, url: string, gameId: string): Promise<GameClient> {
  const sockets = new SocketManager({
    serverUrl: url,
    token: token,
    gameId: gameId, 
  });

  await sockets.socketsReady();

  // const zklib = new ZkLib();
  const zklib = new ZkLibMock();
  const interfacer = new Interfacer();
  attachListeners(interfacer);

  const client = new GameClient(sockets, zklib);

  await client.play();
  const seat = await interfacer.waitForSeat();
  const board = new Board(seat);
  
  const agents = mockDeploys(board, seat);
  interfacer.deployAgents(agents);
   
  return client
}

function attachListeners(i: Interfacer) {

  i.on(IfEvents.Connect,(data: Connection) => {
    i.seat = data.seat; 
  });

  i.on(IfEvents.Turn, (newTurn: Turn) => {
    if (i.turn.round < newTurn.round) {
      i.turn = newTurn;
    }
  });

  i.on(IfEvents.Impacts, (p: Impacts) => {
    i.impacts = p;
  }); 
}

function mockDeploys(board: Board, seat: PlayerSeat) {
 
  let agents: IJ[];
  if (seat % 2 === 0) {
    agents = [board.allowedPlacements[0], board.allowedPlacements[0], board.allowedPlacements[0], board.allowedPlacements[0]];
  } else {
    agents = [board.allowedPlacements[2], board.allowedPlacements[2], board.allowedPlacements[2], board.allowedPlacements[2]];
  }

  console.log("SETUP: PROPOSED-AGENTS:", agents);

  return board.addAgents({agents})
}
