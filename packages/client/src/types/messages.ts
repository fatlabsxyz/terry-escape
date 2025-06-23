import { SocketId } from "./game.js";
import { GameMessage, GameMsg, GamePayload } from "./gameMessages.js"
import { LobbyMsg, LobbyPayload } from "./lobbyMessages.js"

export enum Msg {
  CONNECT = "connect",
}

export type Event = `${Msg}` | `${GameMsg}` | `${LobbyMsg}`
export type MessagePayload = GamePayload | LobbyPayload;

export type ProofsEmitMessage = {
  sid: SocketId;
  type: GameMsg;
  messages: GameMessage[]; 
}

export interface Message {
  sender: string
  event: Event
  payload: MessagePayload
}
