import { PlayerId, PlayerSeat } from "./game.js"
import { Message } from "./messages.js"
import { ProofData } from "zklib/types"


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
  FETCH_PROOFS = "game:fetch_proofs",
  PROOFS = "game:proofs",
}

export interface GamePayload {
}

export interface GameProofsPayload extends GamePayload {
  type: `${GameMsg}`;
  messages: GameMessage[];
}

export interface GameDeployPayload extends GamePayload {
  deploys: ProofData;
}

export interface GamePlayerSeatPayload extends GamePayload {
  seat: PlayerSeat;
}

export interface GameQueryPayload extends GamePayload {
  queries: ProofData[];
}

export interface GameAnswerPayload extends GamePayload {
  to: PlayerId;
  proof: ProofData;
}

export interface GameUpdatePayload extends GamePayload {
  proof: ProofData;
  died: boolean;
}

export interface GameReportPayload extends GamePayload {
  proof: ProofData;
  died: boolean;
}

export interface GameEndPayload extends GamePayload {
  winner: string;
}

export interface IGameMessage extends Message {
  event: `${GameMsg}`;
  turn: number;
  to?: PlayerId; 
}

export interface GameDeployMsg extends IGameMessage {
  payload: GameDeployPayload;
}

export interface GameQueryMsg extends IGameMessage {
  payload: GameQueryPayload;
}

export interface GamePlayerSeatMsg extends IGameMessage {
  payload: GamePlayerSeatPayload;
}

export interface GameAnswerMsg extends IGameMessage {
  payload: GameAnswerPayload;
}

export interface GameUpdateMsg extends IGameMessage {
  payload: GameUpdatePayload;
}

export interface GameReportMsg extends IGameMessage {
  payload: GameReportPayload;
}

export interface GameProofsMsg extends IGameMessage {
  payload: GameProofsPayload;
}

export interface GameEndMsg extends IGameMessage {
  payload: GameEndPayload;
}

export interface RetrieveMsg {
  event: `${GameMsg}`;
  turn: number;
}

export type GameMessage = GameDeployMsg | GameQueryMsg | GameAnswerMsg | GameUpdateMsg | GameReportMsg | GamePlayerSeatMsg | GameEndMsg;

export type GameMessagePayload = GameDeployPayload | GameQueryPayload | GameAnswerPayload | GameUpdatePayload | GameReportPayload | GameEndPayload;
