import { io, Socket } from "socket.io-client";
import { setupLobby } from "./sockets/lobby.socket.js";
import { setupPlayers } from "./sockets/players.socket.js";
import { setupGame } from "./sockets/game.socket.js";

export interface SetupSocketOptions {
  serverUrl: string;
  token: string,
  gameId: string,
  forceNew?: boolean
}

export interface ClientSockets {
  lobby: Socket;
  game: Socket;
}

export function setupSockets(options: SetupSocketOptions): ClientSockets {

  const {
    serverUrl,
    token,
    gameId,
  } = options;

  const forceNew = options.forceNew === undefined ? false : true;

  const mgr = io({
    forceNew: true,
    auth: {
      token: name
    }
  });

  const socketOptions = {
    serverUrl,
    token,
    forceNew,
  }

  const lobby = setupLobby(socketOptions);

  let players;
  const gameOptions = { ...socketOptions, token, gameId }
  const game = setupGame(gameOptions);
  // const playerOptions = { ...gameOptions, name }
  // players = setupPlayers(playerOptions)

  return {
    lobby,
    game,
    // players
  }

}
