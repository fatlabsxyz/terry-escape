import { io, Socket } from "socket.io-client";
import { GameOptions } from "./socket.types.js";
import { GameMsg } from "../../types/gameMessages.js";


export function setupGame(options: GameOptions): Socket {

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

  game.on(GameMsg.STARTED, (stuff: string) => {
    game.emit(GameMsg.SALUTE, options.name);
    log(`hi! I'm ${options.name}`);
  })

  game.on(GameMsg.SALUTE, (playerName: string) => {
    log(`${playerName} is presenting themselves.`);
  })

  // game.on("confirm", (msg, ack) => {
  //   log("Server asking for confirmation", msg);
  //   ack(true)
  // })

  return game

}


