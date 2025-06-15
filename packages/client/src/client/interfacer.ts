import { EventEmitter } from "events";
import { AgentLocation, Locations, PlayerSeat } from "../types/game.js";
import { passTime } from "../utils.js";

export enum IfEvents {
  Connect = "inter:connect",
  Deploy  = "inter:deploy",
  Turn    = "inter:turn",
  Action  = "inter:action",
  Impacts = "inter:impacts",
}

export type Turn = {
  round:  number;
  active: undefined | boolean;
};

export type Impacts = {};

export type Connection = {
  seat: PlayerSeat;
};

const TIMEOUT = 15_000;

export class Interfacer extends EventEmitter {
  
  turn:    Turn;
  seat:    undefined | PlayerSeat = undefined;
  impacts: undefined | Impacts    = undefined;
  deploys: undefined | Locations  = undefined;
  

  //TODO finish this later (it's the event interface between frontend and gameMachine turn for Active and NonActivePlayer 
  constructor(){
    super();
    this.turn = {round: 0, active: undefined};
  }

  takeAction(action: string) {
    this.emit(IfEvents.Action, {})
  }

  deployAgents(agents: Locations) { 
    this.emit(IfEvents.Deploy, agents);
  } 

  waitForSeat(): Promise<PlayerSeat> {
    return new Promise(async (res, rej) => {
      setTimeout(rej, TIMEOUT);
      while (true) { 
        const recieved = (this.seat !== undefined);
        if (recieved) { break; } else { await passTime(100); }
      }
      res(this.seat as PlayerSeat)
    });
  }

  waitForDeploy(): Promise<Locations> {
    return new Promise(async (res, rej) => {
      setTimeout(rej, TIMEOUT);
      while (true) { 
        const recieved = (this.deploys !== undefined);
        if (recieved) { break; } else { await passTime(100); }
      }
      res(this.deploys as Locations)
    });
  }


  // START LOGIC 
  // CLIENT   => inter.on(IfEvents.CONNECT) { set player index, etc... } 
  // FRONTEND => inter.on(IfEvents.DEPLOY)  { SEND agents in board, etc... }

  // TURN LOGIC
  // CLIENT   => inter.on(IfEvents.TURN)    { set active or not, etc... } 
  // FRONTEND => inter.on(IfEvents.ACTION)  { SEND desired action, etc... } 
  // CLIENT   => inter.on(IfEvents.IMPACTS) { set collision and death for agent, etc... }
  // START TURN AGAIN
}
