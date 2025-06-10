import { EventEmitter } from 'events';
import { PlayerSeat, StoredPlayers, PlayerProps, Err, PlayerId, SocketId } from 'client/types';


export class PlayerStorage extends EventEmitter{
  private static instance: PlayerStorage;
  private players: StoredPlayers;

  private constructor(){
    super();
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
  
  getPlayerBySeat(seat: PlayerSeat): Err | PlayerProps {
    const player: PlayerProps = [...this.players.entries()].find(([key, value]) => value.seat === seat)![1];
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

  getAllSocketIds(): Map<PlayerId, SocketId> {
    let allSocketIds = new Map();
    this.players.forEach( (player, playerId) => {
      allSocketIds.set(playerId, player.sid);
    });
    return allSocketIds;
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

  updatePlayerSeat(id: PlayerId, seat: PlayerSeat): Err | void {
    // take player id, update their seat if needed
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

  emitPlayerSeat(playerId: PlayerId) {
    this.emit("SEAT", playerId);
  }
}
