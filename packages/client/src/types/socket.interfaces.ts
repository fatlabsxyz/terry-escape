import { Socket } from "socket.io-client";
import { TurnInfo } from "./game.js";
import { GameAnswerPayload, GameMsg, GameQueryPayload, GameUpdatePayload } from "./gameMessages.js";
import { Message } from "./messages.js";

type Ack = () => void;

export interface GameAnswerMsg extends Message {
  // event: GameMsg.ANSWER,  // TODO: fix types
  // event: `${GameMsg.ANSWER}`,
  payload: GameAnswerPayload
}

export interface GameQueryMsg extends Message {
  payload: GameQueryPayload
}

export interface GameUpdateMsg extends Message {
  payload: GameUpdatePayload
}

export interface GameNspClientToServerEvents {
  [GameMsg.READY]: (cb: Ack) => void;
  [GameMsg.TURN_END]: (cb: Ack) => void;

  /* QUERY is broadcasted to all gameId peers client -> server ->br-> clients
  * This is the client side typing
  */
  [GameMsg.QUERY]: (p: GameQueryMsg, cb: Ack) => void;

  /* ANSWER is broadcasted to all gameId peers client -> server ->br-> clients
  * This is the client side typing
  */
  [GameMsg.ANSWER]: (p: GameAnswerMsg, cb: Ack) => void;

  /* UPDATE is broadcasted to all gameId peers client -> server ->br-> clients
  * This is the client side typing
  */
  [GameMsg.UPDATE]: (p: GameUpdateMsg, cb: Ack) => void;
}

export interface GameNspServerToClientEvents {
  [GameMsg.STARTED]: (cb: Ack) => void;
  [GameMsg.FINISHED]: (cb: Ack) => void;

  [GameMsg.TURN_START]: (turnInfo: TurnInfo, ack: Ack) => void;
  [GameMsg.TURN_END]: (cb: Ack) => void;
  [GameMsg.READY]: (cb: Ack) => void;

  /* QUERY is broadcasted to all gameId peers client -> server ->br-> clients
  * This is the server side typing
  */
  [GameMsg.QUERY]: (p: GameQueryMsg, cb: Ack) => void;

  /* ANSWER is broadcasted to all gameId peers client -> server ->br-> clients
  * This is the server side typing
  */
  [GameMsg.ANSWER]: (p: GameAnswerMsg, cb: Ack) => void;

  /* UPDATE is broadcasted to all gameId peers client -> server ->br-> clients
  * This is the server side typing
  */
  [GameMsg.UPDATE]: (p: GameUpdateMsg, cb: Ack) => void;
}

export type GameSocket = Socket<GameNspServerToClientEvents, GameNspClientToServerEvents>;
