import { Socket } from "socket.io-client";
import { TurnInfo } from "./game.js";
import { GameAnswerMsg, GameMsg, GameQueryMsg, GameReportMsg, GameUpdateMsg, GameDeployMsg, GamePlayerSeatMsg, GameMessage, RetrieveMsg } from "./gameMessages.js";


type Ack = () => void;

export interface GameNspClientToServerEvents {
  [GameMsg.DUMMY]: (...args: any[]) => void;

  [GameMsg.READY]: (cb: Ack) => void;
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
  

  [GameMsg.FETCH_PROOFS]: (w: RetrieveMsg, cb: Ack) => void;
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
  [GameMsg.DEPLOY]: (p: GameDeployMsg[], cb: Ack) => void;

  /* QUERY is broadcasted to all gameId peers client -> server ->br-> clients
  * This is the server side typing
  */
  [GameMsg.QUERY]: (p: GameQueryMsg[], cb: Ack) => void;

  /* ANSWER is broadcasted to all gameId peers client -> server ->br-> clients
  * This is the server side typing
  */
  [GameMsg.ANSWER]: (p: GameAnswerMsg[], cb: Ack) => void;

  /* UPDATE is broadcasted to all gameId peers client -> server ->br-> clients
  * This is the server side typing
  */
  [GameMsg.UPDATE]: (p: GameUpdateMsg[], cb: Ack) => void;

  /* REPORT is broadcasted to all gameId peers client -> server ->br-> clients
  * This is the server side typing
  */
  [GameMsg.REPORT]: (p: GameReportMsg[], cb: Ack) => void;
  
  [GameMsg.PLAYER_SEAT]: (p: GamePlayerSeatMsg, cb: Ack) => void;
  
  [GameMsg.FETCH_PROOFS]: (p: GameMessage[], cb: Ack) => void;
}

export type GameSocket = Socket<GameNspServerToClientEvents, GameNspClientToServerEvents>;
