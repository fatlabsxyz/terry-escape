import { GameAnswerMsg, GameMsg, GameNspClientToServerEvents, GameNspServerToClientEvents, GameQueryMsg, GameReportMsg, GameUpdateMsg, GameDeployMsg, JwtPayload } from 'client/types';
import { Namespace, Server, Socket } from 'socket.io';
import { getGameOrNewOne, Player } from '../game.js';
import jwt from 'jsonwebtoken';
import { Err, PlayerProps, PlayerStorage } from '../playerStorage.js';

type Ack = () => void;

type AckPlayerIndex = (playerIndex: number | undefined) => void;

interface InterServerEvents { }
interface SocketData {
    id: string,
    name: string,
    socketId: string,
}

export type GameNsp = Namespace<
  GameNspClientToServerEvents,
  GameNspServerToClientEvents,
  InterServerEvents,
  SocketData
>;

export type GameSocket = Socket<
  GameNspClientToServerEvents,
  GameNspServerToClientEvents,
  InterServerEvents,
  SocketData
>

const playerStorage: PlayerStorage = PlayerStorage.getInstance();

function registerGameHandlers(socket: GameSocket) {

  const TIMEOUT = 300_000;
  /*///////////////////////////////////////////////////////////////
                          BROADCASTING
  //////////////////////////////////////////////////////////////*/
  socket.on(GameMsg.DEPLOY, async (p: GameDeployMsg, ack: Ack) => {
    await socket
      .broadcast
      .timeout(TIMEOUT)
      .emitWithAck(GameMsg.DEPLOY, p);
    ack();
  }); 

  socket.on(GameMsg.QUERY, async (p: GameQueryMsg, ack: Ack) => {
    console.log("THE QUERY HAS ARRIVED:", JSON.stringify(p.payload.queries).slice(0, 100)); // todo remove
    await socket
      .broadcast
      .timeout(TIMEOUT)
      .emitWithAck(GameMsg.QUERY, p);
    ack();
  });

  socket.on(GameMsg.ANSWER, async (p: GameAnswerMsg, ack: Ack) => {
    await socket
      .broadcast
      .timeout(TIMEOUT)
      .emitWithAck(GameMsg.ANSWER, p);
      ack();
  });

  socket.on(GameMsg.UPDATE, async (p: GameUpdateMsg, ack: Ack) => {
    await socket
      .broadcast
      .timeout(TIMEOUT)
      .emitWithAck(GameMsg.UPDATE, p);
    ack();
  });

  socket.on(GameMsg.REPORT, async (p: GameReportMsg, ack: Ack) => {
    await socket
      .broadcast
      .timeout(TIMEOUT)
      .emitWithAck(GameMsg.REPORT, p);
    ack();
  });

  socket.on(GameMsg.READY, async (ack: AckPlayerIndex) => {
    const game = getGameOrNewOne(socket.nsp);
    const playerIndex = game.readyPlayer(socket.data.id as Player);
    ack( playerIndex );
  });
  
  // TODO: deprecate
  socket.on(GameMsg.GET_PLAYER_INDEX, async (ack: AckPlayerIndex) => {
    const game = getGameOrNewOne(socket.nsp);
    const playerIndex = game.getPlayerIndex(socket.data.id as Player);
    ack( playerIndex );
  });

}

export function addGameNamespace(server: Server): Server {
  // nsp ~ /game/V1StGXR8_Z5jdHi6B2myT
  const gameNsp: GameNsp = server.of(/^\/game\/[a-zA-Z0-9_\-]+$/);

  
  const SECRET_KEY = 'test-key';
  gameNsp.use((socket, next) => {
    if (!socket.handshake.auth.token) {
      return next(new Error ('No player token provided'));
    }

    jwt.verify(socket.handshake.auth.token, SECRET_KEY, (err: jwt.VerifyErrors | null, decoded: unknown) => {
      if (err) {
        return next(new Error('Invalid Token'));
      }
      const data = decoded as JwtPayload; 
      socket.data.name = data.name;
      socket.data.id = data.id;
      socket.data.socketId = socket.id;
      next();
    });
  });

  gameNsp.on('connection', async (socket) => {
    
    const game = getGameOrNewOne(socket.nsp);
    registerGameHandlers(socket);
    console.log(`[${socket.id}] User connection`);
    
    const playerId = socket.data.id;
        

    let player: string | PlayerProps = playerStorage.getPlayer(playerId);
    if (player === Err.NOTFOUND){
      player = {
        id: playerId,
        sid: socket.id,
        name: socket.data.name,
        seat: undefined,
      }
      console.log("player connected for the first time: ", player);
      playerStorage.addPlayer(player);
    } else {
      console.log("player reconnected: ", player)
      playerStorage.updatePlayerSid(playerId, socket.id);
    }

    player = player as PlayerProps;

    game.addPlayer(player.id as Player);
    console.log(`welcome ${player.name} with id ${player.id} :\) \n and socketId ${player.sid}`);
    
    socket.on("disconnect", async (reason) => {
      console.log(`SOCKET ${socket.id}, ${socket.data.name}, DISCONNECT: ${reason}`);
    });
  });
  
  return server;
}

