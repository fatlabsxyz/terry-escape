import { Err, PlayerProps, GameAnswerMsg, GameMsg, GameNspClientToServerEvents, GameNspServerToClientEvents, GameQueryMsg, GameReportMsg, GameUpdateMsg, GameDeployMsg, JwtPayload, GameProofsPayload, PlayerSeat, PlayerId, SocketId, RetrieveMsg} from 'client/types';
import { MessageBox, MsgEvents } from 'client';
import { Namespace, Server, Socket } from 'socket.io';
import { getGameOrNewOne, Player, PlayerStatus } from '../game.js';
import jwt from 'jsonwebtoken';
import { PlayerStorage } from '../playerStorage.js';
import { passTime } from 'client';
import { Turn } from '../../../client/dist/messageBox.js';

type Ack = () => void;

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
const msgBox = MessageBox.getInstance();

function registerGameHandlers(socket: GameSocket) {

  const TIMEOUT = 300_000;
  /*///////////////////////////////////////////////////////////////
                          PROOF  GATHERING
                          AND BROADCASTING
  //////////////////////////////////////////////////////////////*/
  
  msgBox.on(MsgEvents.BROADCAST, async (v: GameProofsPayload) => {

    const type = v.type;

    const allPlayers: Map<PlayerId, SocketId> = playerStorage.getAllSocketIds()

    await Promise.all([...allPlayers.entries()].map( async (value) => { 
      const sender = value[0]!;
      const playerSid = value[1]!;
      // console.log(`\n\n MSG-LOG-BROADCAST: ${type} SENT TO ID:${sender}`);
      let messages = v.messages.filter(x => x.sender !== sender);
 
      const players = msgBox.players;
      
      switch (type) {
        case GameMsg.DEPLOY: messages = messages.map(x => x as GameDeployMsg) 
        case GameMsg.QUERY : {
          messages = messages.map(x => x as GameQueryMsg )
            .sort((a, b) => {
              const aSeat = players.get(a.to!)!;
              const bSeat = players.get(b.to!)!;
              return aSeat - bSeat;
            });
        }
        case GameMsg.ANSWER: { 
          messages = messages.map(x => x as GameAnswerMsg)
            .sort((a, b) => {
              const aSeat = players.get(a.to!)!;
              const bSeat = players.get(b.to!)!;
              return aSeat - bSeat;
            });
        }
        case GameMsg.UPDATE: { 
          messages = messages.map(x => x as GameUpdateMsg)
            .sort((a, b) => {
              const aSeat = players.get(a.to!)!;
              const bSeat = players.get(b.to!)!;
              return aSeat - bSeat;
            });
        }
        case GameMsg.REPORT: messages = messages.map(x => x as GameReportMsg) 
      }
      // console.log(`MSG-LOG-BROADCAST: MESSAGES: ${messages}, LEN: ${messages.length}. EMITTED...\n\n\n`);
      await socket.to(playerSid).timeout(TIMEOUT).emitWithAck(
        GameMsg.PROOFS,
        {
          type,
          messages
        });
    })); 
  });
  
  msgBox.on(MsgEvents.PLAYERS, (players: PlayerStatus[]) => {
    players.forEach((player) => {
      msgBox.players.set(player.id as PlayerId, player.seat as PlayerSeat); 
    });
  });


  msgBox.on(MsgEvents.CLEAN, () => {
    msgBox.clearOldMessages();
  });

  socket.on(GameMsg.FETCH_PROOFS, async (p: RetrieveMsg, ack: Ack) => {

    switch (p.event) {
      case GameMsg.DEPLOY: await socket.emitWithAck(GameMsg.DEPLOY, msgBox.deploys );
      case GameMsg.QUERY : await socket.emitWithAck(GameMsg.QUERY , msgBox.queries.get(p.turn)!);
      case GameMsg.ANSWER: await socket.emitWithAck(GameMsg.ANSWER, msgBox.answers.get(p.turn)!);
      case GameMsg.UPDATE: await socket.emitWithAck(GameMsg.UPDATE, msgBox.updates.get(p.turn)!);
      case GameMsg.REPORT: await socket.emitWithAck(GameMsg.REPORT, [msgBox.reports.get(p.turn)!]);
    };
    ack(); 
  });

  socket.on(GameMsg.DEPLOY, async (p: GameDeployMsg, ack: Ack) => {
    msgBox.storeValue(p);
    // console.log(`\n\nGOT SOME ${p.event}: from:${p.sender}, ${p.payload}\n\n`);
    ack(); 
  });

  socket.on(GameMsg.QUERY, async (p: GameQueryMsg, ack: Ack) => {
    msgBox.storeValue(p);
    // console.log(`\n\nGOT SOME ${p.event}: from:${p.sender}, ${p.payload}\n\n`);
    ack();
  });

  socket.on(GameMsg.ANSWER, async (p: GameAnswerMsg, ack: Ack) => {
    msgBox.storeValue(p);
    // console.log(`\n\nGOT SOME ${p.event}: from:${p.sender}, ${p.payload}\n\n`);
    ack();
  });

  socket.on(GameMsg.UPDATE, async (p: GameUpdateMsg, ack: Ack) => {
    msgBox.storeValue(p);
    // console.log(`\n\nGOT SOME ${p.event}: from:${p.sender}, ${p.payload}\n\n`);
    ack();
  });

  socket.on(GameMsg.REPORT, async (p: GameReportMsg, ack: Ack) => {
    msgBox.storeValue(p);
    // console.log(`\n\nGOT SOME ${p.event}: from:${p.sender}, ${p.payload}\n\n`);
    ack();
  });

  socket.on(GameMsg.READY, async (ack: Ack) => {
    const game = getGameOrNewOne(socket.nsp);
    game.readyPlayer(socket.data.id as Player);
    ack();
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
    console.log(`GAME-NSP: [${socket.id}] User connection`);
    
    const playerId = socket.data.id;
        

    let player: string | PlayerProps = playerStorage.getPlayer(playerId);
    if (player === Err.NOTFOUND){
      player = {
        id: playerId,
        sid: socket.id,
        name: socket.data.name,
      } as PlayerProps
      console.log("player connected for the first time: ", player);
      playerStorage.addPlayer(player);
    } else {
      console.log("player reconnected: ", player)
      playerStorage.updatePlayerSid(playerId, socket.id);
    }

    const p = player as PlayerProps;

    game.addPlayer(p.id as Player);
    console.log(`welcome ${p.name} with id ${p.id} :\) \n and socketId ${p.sid}`);
    
    socket.on("disconnect", async (reason) => {
      console.log(`SOCKET ${socket.id}, ${socket.data.name}, DISCONNECT: ${reason}`);
    });
  });
 
  return server;
}

