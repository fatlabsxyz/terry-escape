import { Socket } from "socket.io-client";
import { TurnInfo } from "./game.js";
import { GameAnswerMsg, GameMsg, GameQueryMsg, GameReportMsg, GameUpdateMsg, GameDeployMsg } from "./gameMessages.js";

type Ack = () => void;

type AckPlayerIndex = (playerIndex: number) => void;

export interface GameNspClientToServerEvents {
  [GameMsg.DUMMY]: (...args: any[]) => void;

  [GameMsg.READY]: (cb: AckPlayerIndex) => void;
  // [GameMsg.WAITING]: (cb: Ack) => void;
  [GameMsg.TURN_END]: (cb: Ack) => void;

  /* DEPLOY is broadcasted to all gameId peers client -> server ->br-> clients
  * This is the client side typing
  */
  [GameMsg.DEPLOY]: (p: GameDeployMsg, cb: Ack) => void;

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

  /* UPDATE is broadcasted to all gameId peers client -> server ->br-> clients
  * This is the client side typing
  */
  [GameMsg.REPORT]: (p: GameReportMsg, cb: Ack) => void;
}

export interface GameNspServerToClientEvents {
  [GameMsg.DUMMY]: (...args: any[]) => void;

  [GameMsg.STARTED]: (cb: Ack) => void;
  [GameMsg.FINISHED]: (cb: Ack) => void;

  [GameMsg.TURN_START]: (turnInfo: TurnInfo, ack: Ack) => void;
  [GameMsg.TURN_END]: (cb: Ack) => void;
  [GameMsg.WAITING]: (cb: (waitingRes: { player: string, waiting: boolean }) => void) => void;
  [GameMsg.READY]: (cb: Ack) => void;

  /* DEPLOY is broadcasted to all gameId peers client -> server ->br-> clients
  * This is the server side typing
  */
  [GameMsg.DEPLOY]: (p: GameDeployMsg, cb: Ack) => void;

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

  /* REPORT is broadcasted to all gameId peers client -> server ->br-> clients
  * This is the server side typing
  */
  [GameMsg.REPORT]: (p: GameReportMsg, cb: Ack) => void;
}

export type GameSocket = Socket<GameNspServerToClientEvents, GameNspClientToServerEvents>;
