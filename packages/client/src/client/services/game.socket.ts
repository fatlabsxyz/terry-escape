import { io } from "socket.io-client";
import { GameOptions } from "./socket.types";


export function setupGame(options: GameOptions) {

  const {
    serverUrl,
    token,
    gameId,
    log
  } = options

  const game = io(`${serverUrl}/game/${gameId}`, {
    auth: {
      token
    }
  });

  game.on("connect", () => {
    log("Connected to game");
  })

  // game.on("confirm", (msg, ack) => {
  //   log("Server asking for confirmation", msg);
  //   ack(true)
  // })

  return game

}


