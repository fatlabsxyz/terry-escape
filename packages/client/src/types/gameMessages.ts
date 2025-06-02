import { Player, PlayerIndex } from "./game.js"
import { Message } from "./messages.js"
import { ProofData, Collision } from "zklib/types"


export enum GameMsg {
  DUMMY = "game:dummy",

  SALUTE = "game:salute",
  
  STARTED = "game:started",
  FINISHED = "game:finished",
  READY = "game:player_ready",
  WAITING = "game:player_waiting",

  TURN_START = "game:turn_start",
  TURN_END = "game:turn_end",
  
  DEPLOY = "game:deploy",
  QUERY = "game:query",
  ANSWER = "game:answer",
  UPDATE = "game:update",
  REPORT = "game:report",

  PLAYER_SEAT = "game:player_seat",
  FETCH_PROOFS = "game:fetch_proofs"
}

export interface GamePayload {
}

export interface GameDeployPayload extends GamePayload {
  deploys: ProofData;
}

export interface GamePlayerSeatPayload extends GamePayload {
  seat: PlayerIndex;
}

export interface GameQueryPayload extends GamePayload {
  queries: ProofData[];
}

export interface GameAnswerPayload extends GamePayload {
  to: Player
  proof: ProofData;
}

export interface GameUpdatePayload extends GamePayload {
  proof: ProofData;
}

export interface GameReportPayload extends GamePayload {
  proof: ProofData;
}

export interface IGameMessage extends Message {
  event: `${GameMsg}`
  turn: number
  to?: Player
}

export interface GameDeployMsg extends IGameMessage {
  payload: GameDeployPayload
}

export interface GameQueryMsg extends IGameMessage {
  payload: GameQueryPayload
}

export interface GamePlayerSeatMsg extends IGameMessage {
  payload: GamePlayerSeatPayload;
}

export interface GameAnswerMsg extends IGameMessage {
  payload: GameAnswerPayload
  to: Player
}

export interface GameUpdateMsg extends IGameMessage {
  payload: GameUpdatePayload
}

export interface GameReportMsg extends IGameMessage {
  payload: GameReportPayload
}


export type GameMessage = GameDeployMsg | GameQueryMsg | GameAnswerMsg | GameUpdateMsg | GameReportMsg | GamePlayerSeatMsg
