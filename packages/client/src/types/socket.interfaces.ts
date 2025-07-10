import { Socket } from "socket.io-client";
import { TurnInfo, TurnInfoPayload } from "./game.js";
import { GameAnswerMsg, GameMsg, GameQueryMsg, GameReportMsg, GameUpdateMsg, GameDeployMsg, GamePlayerSeatMsg, GameMessage, RetrieveMsg, GameProofsPayload, GameEndPayload, GameEndMsg, GamePlayersUpdatePayload } from "./gameMessages.js";


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
  [GameMsg.FINISHED]: (p: GameEndMsg) => void;

  [GameMsg.TURN_START]: (turnInfo: TurnInfoPayload, ack: Ack) => void;
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
  
  [GameMsg.PLAYER_SEAT]: (p: GamePlayerSeatMsg) => void;
   
  [GameMsg.PROOFS]: (p: GameProofsPayload , cb: Ack) => void;
  
  [GameMsg.PLAYERS_UPDATE]: (p: GamePlayersUpdatePayload) => void;
}

export type GameSocket = Socket<GameNspServerToClientEvents, GameNspClientToServerEvents>;
