import { EventEmitter } from "eventemitter3";
import { AgentLocation, Locations, PlayerSeat, TurnAction } from "../types/game.js";
import { passTime } from "../utils.js";
import { Collision } from "zklib/types";

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

export type Impacts = {
  collision: Collision;
  impacted: boolean;
};

export type Connection = {
  seat: PlayerSeat;
};

const TIMEOUT = 15_000;

export class Interfacer extends EventEmitter {
  
  turn:    Turn;
  seat:    undefined | PlayerSeat = undefined;
  impacts: undefined | Impacts    = undefined;
  deploys: undefined | Locations  = undefined;
  action:  undefined | TurnAction = undefined;
  
  constructor(){
    super();
    this.turn = {round: 0, active: undefined};
  }

  takeAction(action: TurnAction) {
    this.emit(IfEvents.Action, action);
  }

  deployAgents(agents: Locations) { 
    this.emit(IfEvents.Deploy, agents);
  }

  // waiters

  waitForSeat(): Promise<PlayerSeat> {
    return new Promise(async (res, rej) => {
      setTimeout(rej, TIMEOUT);
      while (true) { 
        console.log("\n\nWAITING FOR SEAT ON FRONTEND", this.seat)
        const recieved = (this.seat !== undefined);
        if (recieved) { break; } else { await passTime(300); }
      }
      res(this.seat as PlayerSeat)
    });
  }

  waitForDeploy(): Promise<Locations> {
    return new Promise(async (res, rej) => {
      setTimeout(rej, TIMEOUT);
      while (true) { 
        const recieved = (this.deploys !== undefined);
        if (recieved) { break; } else { await passTime(300); }
      }
      res(this.deploys as Locations)
    });
  }

  waitForAction(): Promise<TurnAction> {
    return new Promise(async (res, rej) => {
      setTimeout(rej, TIMEOUT);
      while (true) { 
        const recieved = (this.action !== undefined);
        if (recieved) { break; } else { await passTime(300); }
      }
      res(this.action as TurnAction)
      this.action = undefined;
    });
  }

  waitForImpacts(): Promise<Impacts> {
    return new Promise(async (res, rej) => {
      setTimeout(rej, TIMEOUT);
      while (true) { 
        const recieved = (this.impacts !== undefined);
        if (recieved) { break; } else { await passTime(300); }
      }
      res(this.impacts as Impacts)
      this.impacts = undefined;
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
