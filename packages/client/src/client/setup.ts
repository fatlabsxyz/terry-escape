import { io } from "socket.io-client";
import { setupLobby } from "./services/lobby.socket";
import { setupPlayers } from "./services/players.socket";
import { setupGame } from "./services/game.socket";

export interface SetupSocketOptions {
  serverUrl: string;
  name: string,
  token: string,
  gameId: string,
  forceNew?: boolean
}

export function setupSockets(options: SetupSocketOptions) {

  const {
    serverUrl,
    name,
    token,
    gameId,
  } = options;

  const forceNew = options.forceNew === undefined ? false : true;

  const prefix = name.split('-')[0];
  const log = (...args: any[]) => console.log(`[${prefix}]`, ...args);

  const mgr = io({
    forceNew: true,
    auth: {
      token: name
    }
  });

  const socketOptions = {
    serverUrl,
    name,
    token,
    forceNew,
    log,
  }

  const lobby = setupLobby(socketOptions);

  let game, players;
  if (gameId !== null) {
    const gameOptions = { ...socketOptions, gameId }
    game = setupGame(gameOptions);
    // const playerOptions = { ...gameOptions, name }
    // players = setupPlayers(playerOptions)
  }

  return {
    lobby,
    game,
    // players
  }

}

