import { io } from "socket.io-client";
import { GameMsg } from "../../types/gameMessages.js";
import { GameSocket } from "../../types/socket.interfaces.js";
import { GameOptions } from "./socket.types.js";

export function setupGame(options: GameOptions): GameSocket {

  const {
    serverUrl,
    token,
    gameId,
  } = options

  const game: GameSocket = io(`${serverUrl}/game/${gameId}`, {
    auth: {
      token
    }
  });

  game.on("connect", () => {
    console.log("\n\n\nConnected to game");
  });

  game.on("disconnect", (reason) => {
    // set player as disconnected in playerStore?
    console.log("\n\nPLAYER DISCONNECTED, REASON: ", reason);
  });

  game.on(GameMsg.FINISHED, (ack: (ok: boolean) => void) => {
    ack(true)
  })

  return game

;}
