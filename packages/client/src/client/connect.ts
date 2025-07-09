import { GameClient } from "./game/gameclient.js";
import { SocketManager } from "./sockets/socketManager.js";
import { getAuthToken } from "./../utils.js";
import { ZkLibMock } from "./zklib-mock.js";
import { ZkLib } from "zklib";
import { Connection, IfEvents, Impact, Interfacer, Turn } from "./interfacer.js";
import { Board } from "./game/board.js";
import { AgentLocation, IJ, PlayerSeat } from "../types/game.js";
import { Collision } from "zklib/types";

export const FRONTEND_URLS = ['http://localhost:8000'];

export async function getNewToken(name: string, url: string) { 
  const token = await getAuthToken({name, url});
      return token || null;
}

export async function connect(token: string, url: string, gameId: string): Promise<Interfacer> {
  const sockets = new SocketManager({
    serverUrl: url,
    token: token,
    gameId: gameId, 
  });

  await sockets.socketsReady();

  const zklib = new ZkLib();
  // const zklib = new ZkLibMock();
  const interfacer = Interfacer.getInstance();
  attachListeners(interfacer);

  const client = new GameClient(sockets, zklib);

  await client.play();

  
  return interfacer
}

function attachListeners(i: Interfacer) {

  i.on(IfEvents.Connect,(data: Connection) => {
    i.seat = data.seat; 
  });

  i.on(IfEvents.Turn, (newTurn: Turn) => {
    if (i.turn.round < newTurn.round) {
      i.turn = newTurn;
    }
    // if (i.turn.active) {
    //   const action = mockAction(i.seat!);
    //   i.takeAction(action);
    // }
  });

  i.on(IfEvents.Impact, (p: Impact) => {
    i.impact = p;
  });  
  
  i.on(IfEvents.Collision, (p: Collision) => {
    i.collision = p;
  }); 
}

