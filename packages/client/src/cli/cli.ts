import { ZkLibMock } from "../client/zklib-mock.js";
import { ZkLib } from "zklib";
import { GameClient } from "./../client/game/gameclient.js";

import { SocketManager } from "./../client/sockets/socketManager.js";
import { getAuthToken, AuthRequestData } from "./../utils.js";
import { AgentLocation, IJ, PlayerSeat, TurnAction } from "../types/game.js";
import { Board } from "../client/game/board.js";
import { Connection, IfEvents, Impact, Interfacer, Turn } from "../client/interfacer.js";
import { Collision } from "zklib/types";

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
    const interfacer = Interfacer.getInstance();
    attachListeners(interfacer);

    const client = new GameClient(sockets, zklib);

    // submit agent coordinates to game and start playing
    await client.play();
   
    // this should be done outside the function...
    const seat = await interfacer.waitForSeat();
    const board = new Board(seat);
  
    const agents = mockDeploys(board, seat);
    interfacer.deployAgents(agents);

    interfacer.on(IfEvents.Impact, (p: Impact) => {
      interfacer.impact = p;
      
      if (interfacer.impact){
        if (interfacer.turn.active) {
          // should let the frontend know that you hit something at target location
          console.log("\n\n\nYOU JUST IMPACTED SOMEONE\n\n\n")
        } else {
          // frontend should show that something happened near you or you got hit???
        }
      }
    });

    interfacer.on(IfEvents.Collision, (c: Collision) => {
      if (interfacer.collision) {
        console.log("\n\n\nPLAYER IMPACTED BY A COLLISION\n\n\n");
        board.unitsDied(interfacer.collision as AgentLocation); 
        // ^ returns a list of units that died (needed by frontend)
      }
    });

    } else {
      console.log("Could not get user token from gamemaster in /auth")
  } 
}
function attachListeners(i: Interfacer) {

  i.on(IfEvents.Connect, async (data: Connection) => {
    console.log("\n\nINTERFACER - GOT A CONNECT EVENT", data.seat)
    i.seat = data.seat;
  });

  i.on(IfEvents.Turn, async (newTurn: Turn) => {
    console.log("\n\nINTERFACER - GOT A TURN EVENT")
    if (i.turn.round < newTurn.round) {
      i.turn = newTurn;
    }
    if (i.turn.active) {
      const action = mockInfiniteAction(i.seat!);
      i.takeAction(action);
    } else {
      // non-active wait for your turn
    }
  });
}

function mockDeploys(board: Board, seat: PlayerSeat) {
 
  let agents: IJ[];
  if (seat % 2 === 0) {
    agents = [board.allowedPlacements[0], board.allowedPlacements[0], board.allowedPlacements[0], board.allowedPlacements[0]];
  } else {
    agents = [board.allowedPlacements[2], board.allowedPlacements[2], board.allowedPlacements[2], board.allowedPlacements[2]];
  }

  console.log("MOCK-DEPLOYS: PROPOSED-AGENTS:", agents);

  return board.addAgents({agents})
}

let activePlayerLocation: undefined | AgentLocation = undefined;

function mockInfiniteAction(index: PlayerSeat): TurnAction {
  // each player goes from left to right infinitely
  // starting here (depending on their seat):
  // 0 _ _ _   
  // 2 _ _ _   
  // _ 1 _ _   
  // _ 3 _ _   
  const playerStartLoc = { 
    0: 0,
    1: 9,
    2: 4,
    3: 13
  };

  let direction: number = 1;
  const loc = activePlayerLocation;

  activePlayerLocation = loc || (playerStartLoc[index] as AgentLocation);
  
  const reason = activePlayerLocation;
  let target: AgentLocation = 0;

  switch (index) {
    case 0: ( {target, direction} = bounce(reason, 0,  3,  direction) );
    case 1: ( {target, direction} = bounce(reason, 8,  11, direction) );
    case 2: ( {target, direction} = bounce(reason, 4,  7,  direction) );
    case 3: ( {target, direction} = bounce(reason, 12, 15, direction) );    
  }
  return { reason, target, trap: false };
}

function bounce(current: number, min: number, max: number, direction: number): {target: AgentLocation, direction: number}{
  if (current === max && direction === 1)  return { target: max - 1 as AgentLocation, direction: -1 };
  if (current === min && direction === -1) return { target: min + 1 as AgentLocation, direction: 1 };
  return { target: current + direction as AgentLocation, direction };
}


initCli().catch((e) => {
  console.error(e);
  process.exit(1);
});

