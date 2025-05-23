import { PlayerIndex } from 'client/types';

export type PlayerId = string;
export type SocketId = string;
type Name = string;
export enum Err {
  NOTFOUND = "not_found",
  EXISTING = "already_exists",
  DISREGARDED = "update_diregarded",
}

export type PlayerProps = {
  id: PlayerId;                   // unique id
  sid: SocketId;                  // changes each session
  name: Name;                     // just the player name
  seat: undefined | PlayerIndex;  // changes each game
};

type StoredPlayers = Map<PlayerId, PlayerProps>;

export class PlayerStorage {
  private static instance: PlayerStorage;
  private players: StoredPlayers;

  private constructor(){
    this.players = new Map();
  }

  // i feel like java when I'm walking down the street
  public static getInstance(): PlayerStorage {
    if (!PlayerStorage.instance) {
      console.log("PLAYER-STORAGE: creating new instance");
      PlayerStorage.instance = new PlayerStorage();
    }
    return PlayerStorage.instance;
  }
  
  addPlayer(props: PlayerProps): Err | void {
    if (this.players.get(props.id)) {
      return Err.EXISTING;
    }
    this.players.set(props.id, props);
    return;
  }

  getPlayer(id: PlayerId): Err | PlayerProps {
    const player = this.players.get(id);
    if (player) {
      return player;
    } else {
      return Err.NOTFOUND;
    }
  }
  
  /// It's assumed that you already know the player exists
  /// when this method is called.
  getSocketId(id: PlayerId): SocketId {
    const player = this.players.get(id) as PlayerProps;
    return player.sid;
  }

  updatePlayerSid(id: PlayerId, currentSid: SocketId): Err | void {
    // take player id, update their sid if needed
    let player: Err| PlayerProps = this.getPlayer(id);
    if (player === Err.NOTFOUND) {
      return player;
    } else {
      player = player as PlayerProps;
      if (player.sid === currentSid) {
        console.log("PLAYER-SID-UPDATE: disregarded");
        return Err.DISREGARDED;
      }
      console.log(`PLAYER-SID-UPDATE: sid updated from ${player.sid} to ${currentSid}`);
      player.sid = currentSid;

      this.players.set(id, player);
      return;
    } 
  }

  updatePlayerSeat(id: PlayerId, seat: PlayerIndex): Err | void {
    // take player id, update their sid if needed
    let player: Err| PlayerProps = this.getPlayer(id);
    if (player === Err.NOTFOUND) {
      return player;
    } else {
      player = player as PlayerProps;
      if (player.seat === seat) {
        console.log("PLAYER-SEAT-UPDATE: disregarded");
        return Err.DISREGARDED;
      }
      console.log(`PLAYER-SEAT-UPDATE: seat updated from ${player.seat} to ${seat}`);
      player.seat = seat;

      this.players.set(id, player);
      return;
    }
  }
}
