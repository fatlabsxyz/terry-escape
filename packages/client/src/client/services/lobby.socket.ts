import { io, Socket } from "socket.io-client";
import { LobbyOptions } from "./socket.types.js";
import { LobbyMsg } from "../../types/lobbyMessages.js";
import { Msg } from "../../types/messages.js";

export function setupLobby(options: LobbyOptions): Socket {

  const {
    serverUrl,
    token,
    log
  } = options

  const lobby = io(serverUrl, {
    auth: {
      token
    }
  });

  lobby.on(Msg.CONNECT, () => {
    log("Connected to lobby");
  })

  lobby.on(LobbyMsg.PING, (msg) => {
    log(`server: ${msg}`);
  })

  return lobby;

}

