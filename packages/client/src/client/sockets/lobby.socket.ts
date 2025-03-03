import { io, Socket } from "socket.io-client";
import { LobbyOptions } from "./socket.types.js";
import { LobbyMsg } from "../../types/lobbyMessages.js";
import { Msg } from "../../types/messages.js";

export function setupLobby(options: LobbyOptions): Socket {

  const {
    serverUrl,
    token,
  } = options

  const lobby = io(serverUrl, {
    auth: {
      token
    }
  });

  let ping = 0;
  lobby.once("ping2", () => { ping++; console.log("PING", ping) });
  lobby.once("ping2", () => { ping++; console.log("PING", ping) });
  lobby.once("ping2", () => { ping++; console.log("PING", ping) });

  lobby.on(Msg.CONNECT, () => {
    console.log("Connected to lobby");
  })

  lobby.on(LobbyMsg.PING, (msg) => {
    console.log(`server: ${msg}`);
  })

  return lobby;

}

