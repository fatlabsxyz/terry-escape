import { Player } from "./game.js"

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
