import { io } from "socket.io-client";
import { LobbyOptions } from "./socket.types";
import { LobbyMsg } from "../../types/lobbyMessages";
import { Msg } from "../../types/messages";

export function setupLobby(options: LobbyOptions) {

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

