import { Err, PlayerProps, GameAnswerMsg, GameMsg, GameNspClientToServerEvents, GameNspServerToClientEvents, GameQueryMsg, GameReportMsg, GameUpdateMsg, GameDeployMsg, JwtPayload, GameProofsPayload, PlayerSeat, PlayerId, SocketId, RetrieveMsg, ProofsEmitMessage, GameEndPayload, GameEndMsg, GameMessage, TurnEmitMessage} from 'client/types';
import { MessageBox, MsgEvents, passTime } from 'client';
import { Namespace, Server, Socket } from 'socket.io';
import { getGameOrNewOne, PlayerStatus } from '../game.js';
import jwt from 'jsonwebtoken';
import { PlayerStorage } from '../playerStorage.js';

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


msgBox.on(MsgEvents.BROADCAST, async (v: GameProofsPayload) => {

  const type = v.type;

  const allPlayers: Map<PlayerId, SocketId> = playerStorage.getAllSocketIds()

  await Promise.all([...allPlayers.entries()].map( async ([_, playerSid]) => { 
    const players = msgBox.players;
    let messages = v.messages

    const logFormatted = (message: GameMessage) => {
      console.log("event: ", message.event, " -from- ", message.sender, " -to- ", message.to, "\n")
    }

    if (type !== GameMsg.REPORT) {
      console.log("\n\n\n MESSAGES PRE-SORT: ")
      messages.forEach( (message) => logFormatted(message) );
      messages.sort((a, b) => {
        const aSeat = players.get(a.sender)!;
        const bSeat = players.get(b.sender)!;
        return aSeat - bSeat;
      });
      console.log("\n\n\n MESSAGES SORTED: ")
      messages.forEach( (message) => logFormatted(message) );
    }
  
    switch (type) {
      case GameMsg.DEPLOY: messages = messages.map(x => x as GameDeployMsg)
      case GameMsg.QUERY : messages = messages.map(x => x as GameQueryMsg )
      case GameMsg.ANSWER: messages = messages.map(x => x as GameAnswerMsg)
      case GameMsg.UPDATE: messages = messages.map(x => x as GameUpdateMsg)
      case GameMsg.REPORT: messages = messages.map(x => x as GameReportMsg) 
    }     
    msgBox.emit(MsgEvents.PROOFS, {sid: playerSid, type, messages} as ProofsEmitMessage);
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

msgBox.on(MsgEvents.NEWTURN, (turnInfo) => {
  const allPlayers: SocketId[]= Array.from(playerStorage.getAllSocketIds().values())
  allPlayers.forEach((sid) => { 
    msgBox.emitTurn({sid, turnInfo});
  });
});

const TIMEOUT = 300_000;

function registerGameHandlers(socket: GameSocket): boolean {
  
  /*///////////////////////////////////////////////////////////////
                          PROOF  GATHERING
                          AND BROADCASTING
  //////////////////////////////////////////////////////////////*/
  
  msgBox.on(MsgEvents.PROOFS, async (p: ProofsEmitMessage) => {
    await socket.to(p.sid).timeout(TIMEOUT).emitWithAck(
      GameMsg.PROOFS,
      {
        type: p.type,
        messages: p.messages 
      }
    );
  });

  msgBox.on(MsgEvents.TURN, async (p: TurnEmitMessage) => {
    
    await socket.to(p.sid).timeout(TIMEOUT).emitWithAck( GameMsg.TURN_START, p.turnInfo );

  });

  // msgBox.on(MsgEvents.END, async (winner: PlayerId) => { 
  //
  //   const allPlayers: Map<PlayerId, SocketId> = playerStorage.getAllSocketIds()
  //
  //
  //   await Promise.all([...allPlayers.values()].map( async ([_, playerSid]) => { 
  //     const players = msgBox.players;
  //     await socket.to(p.sid).timeout(TIMEOUT).emitWithAck(
  //       GameMsg.WINNER,
  //       {
  //
  //       }
  //     );
  //   }));
  // });
  //

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
    game.readyPlayer(socket.data.id as PlayerId);
    ack();
  });
  
  return true;
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
    if (player === Err.NOT_FOUND){
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

    game.addPlayer(p.id as PlayerId);
    console.log(`welcome ${p.name} with id ${p.id} :\) \n and socketId ${p.sid}`);
    
    socket.on("disconnect", async (reason) => {
      console.log(`SOCKET ${socket.id}, ${socket.data.name}, DISCONNECT: ${reason}`);
    });
  });
 
  return server;
}

