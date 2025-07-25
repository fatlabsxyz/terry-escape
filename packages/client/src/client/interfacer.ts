import { EventEmitter } from "eventemitter3";
import { LeaderBoard, Locations, PlayerId, PlayerSeat, TurnAction } from "../types/game.js";
import { passTime } from "../utils.js";
import { Collision } from "zklib/types";

export enum IfEvents {
  Connect   = "inter:connect",
  Deploy    = "inter:deploy",
  Turn      = "inter:turn",
  Action    = "inter:action",
  Impact    = "inter:impact",
  Collision = "inter:collision",
  Died      = "inter:died",
  Winner    = "inter:winner",
  PlayerDied = "inter:playerDied",
  PlayersUpdate = "inter:playersUpdate",
  MPCLog = "inter:mpcLog",
  DeploymentTimer = "inter:deploymentTimer",
  DeploymentStatus = "inter:deploymentStatus",
}

export type Turn = {
  round:  number;
  active: undefined | boolean;
  playerNames?: { [key: string]: string }; // Map of PlayerId to player names
};

export type Impact = boolean;

export type Update = {
  impact: Impact;
};

export type Connection = {
  seat: PlayerSeat;
};

const TIMEOUT = 300_000; // 5 minutes

export class Interfacer extends EventEmitter {
 
  private static instance: Interfacer;

  turn:        Turn;
  seat:        undefined | PlayerSeat  = undefined;
  impact:      undefined | Impact      = undefined;
  collision:   undefined | Collision   = undefined;
  deploys:     undefined | Locations   = undefined;
  action:      undefined | TurnAction  = undefined;
  winner:      undefined | PlayerId    = undefined;
  leaderboard: undefined | LeaderBoard = undefined;
  
  constructor(){
    super();
    this.turn = {round: 0, active: undefined};
  }

  public static getInstance(): Interfacer {
    if (!Interfacer.instance) {
      console.log("PLAYER-STORAGE: creating new instance");
      Interfacer.instance = new Interfacer();
    }
    return Interfacer.instance;
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
      setTimeout(() => rej(new Error('Timeout waiting for seat assignment')), TIMEOUT);
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
      setTimeout(() => rej(new Error('Timeout waiting for deployment')), TIMEOUT);
      while (true) { 
        const recieved = (this.deploys !== undefined);
        if (recieved) { break; } else { await passTime(300); }
      }
      res(this.deploys as Locations)
    });
  }

  waitForAction(): Promise<TurnAction> {
    return new Promise(async (res, rej) => {
      setTimeout(() => rej(new Error('Timeout waiting for action')), TIMEOUT);
      while (true) { 
        const recieved = (this.action !== undefined);
        if (recieved) { break; } else { await passTime(300); }
      }
      res(this.action as TurnAction)
      this.action = undefined;
    });
  }

  waitForImpact(): Promise<Impact> {
    return new Promise(async (res, rej) => {
      setTimeout(() => rej(new Error('Timeout waiting for impact')), TIMEOUT);
      while (true) { 
        const recieved = (this.impact !== undefined);
        if (recieved) { break; } else { await passTime(300); }
      }
      res(this.impact as Impact)
      this.impact = undefined;
    });
  }

  waitForCollision(): Promise<Collision> {
    return new Promise(async (res, rej) => {
      setTimeout(() => rej(new Error('Timeout waiting for collision')), TIMEOUT);
      while (true) { 
        const recieved = (this.collision !== undefined);
        if (recieved) { break; } else { await passTime(300); }
      }
      res(this.collision as Collision)
      this.collision = undefined;
    });
  }

  // START LOGIC 
  // CLIENT   => inter.on(IfEvents.CONNECT) { set player index, etc... } 
  // FRONTEND => inter.on(IfEvents.DEPLOY)  { SEND agents in board, etc... }

  // TURN LOGIC
  // CLIENT   => inter.on(IfEvents.TURN)    { set active or not, etc... } 
  // FRONTEND => inter.on(IfEvents.ACTION)  { SEND desired action, etc... } 
  // CLIENT   => inter.on(IfEvents.COLLISION) { set collision and death for agent, etc... }
  // CLIENT   => inter.on(IfEvents.IMPACT) { set impact , etc... }
  // START TURN AGAIN
}
