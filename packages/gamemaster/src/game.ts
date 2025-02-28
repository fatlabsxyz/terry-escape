import { GameMsg } from 'client/types';
import { GameNsp } from './sockets/game.js';
import { TurnInfo } from '../../client/dist/types/game.js';
import { passTime } from './utils.js';

export type Player = string & { readonly __brand: unique symbol };

interface PlayerStatus {
  eliminated: boolean;
  ready: boolean;
  place: number;
  id: Player;
}

function newPlayer(player: Player, place: number): PlayerStatus {
  return {
    id: player,
    place,
    ready: false,
    eliminated: false,
  }
}

export class Game {
  started: boolean;
  players: Map<Player, PlayerStatus>;
  round: Player[] = [];
  minPlayers: number;

  private _activePlayer: Player | null = null;
  private _nextPlayer: Player | null = null;

  constructor(readonly id: string, readonly nsp: GameNsp) {
    this.id = id
    this.started = false
    this.minPlayers = 3;
    this.players = new Map();
  }

  get activePlayer() {
    return this._activePlayer!
  }

  async addPlayer(player: Player) {
    if (!this.started) {
      this.players.set(player, newPlayer(player, this.players.size));
    }
  }

  private _gameSetup() {
    this.started = true;
    this.round = Array.from(this.players.values()).map(x => x.id)
    this._activePlayer = this.round[0]!;
    this._nextPlayer = this.round[1]!;
  }

  readyPlayer(player: Player) {
    const status = this.players.get(player);
    if (!status)
      throw Error("Player does not exist");

    status.ready = true;
    this.players.set(player, status)
    this._tryStartGame();
  }

  _allReady(): boolean {
    return Array.prototype.every(x => x.ready, Array.from(this.players.values()))
  }

  // async _waitForPlayersReady() {
  //   while (!this._allReady()) {
  //     await passTime(1_000)
  //   }
  // }

  async _tryStartGame() {
    if (this.players.size >= this.minPlayers && this._allReady()) {
      await this._startGame();
    }
  }

  async _startGame() {
    console.log("The game has started")
    this._gameSetup();
    console.log("PLAYERS", this.players);
    await this._braodcastGameStarted();
    await this._broadcastTurn();
  }

  async _braodcastGameStarted() {
    return await new Promise((res, rej) => {
      this.nsp.timeout(2000).emit(GameMsg.STARTED, res);
    });
  }

  async _endGame() {
    await new Promise((res, rej) => {
      this.nsp.timeout(2000).emit(GameMsg.FINISHED, res);
    });
  }

  private _nextTurn() {
    const round = Array.from(this.players.values())
      .sort((a, b) => b.place - a.place)
      .filter(x => !x.eliminated)
      .map(x => x.id);

    const activeIndex = round.indexOf(this.activePlayer);
    if (activeIndex < 0) {
      console.log(`Active player ${this.activePlayer} has been eliminated`)
      this._activePlayer = round[0]!;
      this._nextPlayer = round[1]!;
    } else {
      this._activePlayer = round[(activeIndex + 1) % round.length]!
      this._nextPlayer = round[(activeIndex + 2) % round.length]!
    }
    this.round = round;
  }

  async nextTurn() {
    this._nextTurn();
    await this._broadcastTurn();
  }

  private async _broadcastTurn() {
    const turnInfo: TurnInfo = this._turnInfo();
    await new Promise((res, rej) => {
      this.nsp.timeout(2000).emit(GameMsg.TURN_START, turnInfo, res);
    });
  }

  private _turnInfo(): TurnInfo {
    return {
      turn: 0,
      players: this.round,
      activePlayer: this._activePlayer!,
      nextPlayer: this._nextPlayer!
    }
  }

}

export const Games: Map<string, Game> = new Map();

export function getGameOrNewOne(nsp: GameNsp): Game {
  const gameId = nsp.name;
  let game = Games.get(gameId);
  if (game === undefined) {
    game = new Game(gameId, nsp);
    Games.set(gameId, game);
  }
  return game;
}
