import { Socket } from 'socket.io';
import { nanoid } from './utils.js';
import { GameMsg } from 'client/types';

export type Player = string & { readonly __brand: unique symbol };
type Nsp = Socket["nsp"];

export class Game {
  started: boolean;
  players: Player[];
  minPlayers: number;

  constructor(readonly id: string, readonly socket: Nsp) {
    this.id = id
    this.started = false
    this.minPlayers = 3;
    this.players = [];
  }

  addPlayer(player: Player) {
    if (!this.started) {
      this.players.push(player);
      if (this.players.length >= this.minPlayers) {
        this._startGame();
      }
    }
  }

  _startGame() {
    this.started = true;
    console.log("The game has started")
    this.socket.emit(GameMsg.STARTED, "HELLO");
  }

}

export const Games: Map<string, Game> = new Map();

export function getGameOrNewOne(nsp: Nsp): Game {
  const gameId = nsp.name;
  let game = Games.get(gameId);
  if (game === undefined) {
    game = new Game(gameId, nsp);
    Games.set(gameId, game);
  }
  return game;
}

