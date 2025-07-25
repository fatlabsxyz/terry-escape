import { EventEmitter } from 'events';
import { StoredPlayers, PlayerProps, Err, PlayerId, SocketId, Name } from 'client';


export class PlayerStorage extends EventEmitter {
  private static instance: PlayerStorage;
  private players: StoredPlayers;

  private constructor(){
    super();
    this.players = new Map();
  }

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
      return Err.NOT_FOUND;
    }
  }
  
  /// It's assumed that you already know the player exists
  /// when this method is called.
  getPlayerName(id: PlayerId): Name {
    const player = this.players.get(id) as PlayerProps;
    return player.name;
  }
   
  /// It's assumed that you already know the player exists
  /// when this method is called.
  getSocketId(id: PlayerId): SocketId {
    const player = this.players.get(id) as PlayerProps;
    return player.sid;
  }

  getAllSocketIds(): Map<PlayerId, SocketId> {
    let allSocketIds = new Map();
    this.players.forEach( (player: any, playerId: any) => {
      allSocketIds.set(playerId, player.sid);
    });
    return allSocketIds;
  }

  updatePlayerSid(id: PlayerId, currentSid: SocketId): Err | void {
    // take player id, update their sid if needed
    let player: Err| PlayerProps = this.getPlayer(id);
    if (player === Err.NOT_FOUND) {
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
}
