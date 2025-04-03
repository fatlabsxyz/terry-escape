import { Player } from "./game.js"
import { Message } from "./messages.js"

export enum GameMsg {
  DUMMY = "game:dummy",

  SALUTE = "game:salute",

  STARTED = "game:started",
  FINISHED = "game:finished",
  READY = "game:player_ready",
  WAITING = "game:player_waiting",

  TURN_START = "game:turn_start",
  TURN_END = "game:turn_end",

  QUERY = "game:query",
  ANSWER = "game:answer",
  UPDATE = "game:update",
  REPORT = "game:report",
}

export interface GamePayload {
}

export interface GameQueryPayload extends GamePayload {
}

export interface GameAnswerPayload extends GamePayload {
  to: Player
}

export interface GameUpdatePayload extends GamePayload {
}

export interface GameReportPayload extends GamePayload {
}

export interface IGameMessage extends Message {
  event: `${GameMsg}`
  turn: number
  to?: Player
}

export interface GameQueryMsg extends IGameMessage {
  payload: GameQueryPayload
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

export type GameMessage = GameQueryMsg | GameAnswerMsg | GameUpdateMsg | GameReportMsg
