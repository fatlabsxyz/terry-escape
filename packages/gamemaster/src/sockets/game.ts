import { Err, PlayerProps, GameAnswerMsg, GameMsg, GameNspClientToServerEvents, GameNspServerToClientEvents, GameQueryMsg, GameReportMsg, GameUpdateMsg, GameDeployMsg, JwtPayload } from 'client/types';
import { Namespace, Server, Socket } from 'socket.io';
import { getGameOrNewOne, Player } from '../game.js';
import jwt from 'jsonwebtoken';
import { PlayerStorage } from 'client';
import { MessageLog } from '../messageLog.js';

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
const msgLog = new MessageLog();

function registerGameHandlers(socket: GameSocket) {

  const TIMEOUT = 300_000;
  const BROADCAST_TIMEOUT = 1_000;
  const MAX_PLAYERS = 4; 
  /*///////////////////////////////////////////////////////////////
                          PROOF  GATHERING
                          AND BROADCASTING
  //////////////////////////////////////////////////////////////*/
  socket.on(GameMsg.DEPLOY, async (p: GameDeployMsg, ack: Ack) => {
    msgLog.register(p);

    const allDeploys = msgLog.findMessageListForTurn(p.turn, p.event);

    // console.log(`\n\nGOT A DEPLOY FROM:${p.sender}\n\n`)
    // console.log(`\n\nDEPLOYS LEN: ${allDeploys.length}`)
    // allDeploys.forEach(deploy => {
    //   console.log(`\nQUERY LIST ITEM: ${deploy}`);
    // });
    
    if ( allDeploys.length === MAX_PLAYERS ) {
      console.log(`\n\nBROADCASTING DEPLOYS\n\n`)
      await new Promise(resolve => setTimeout(resolve, BROADCAST_TIMEOUT));
      // TODO test emit to each player separately?
      // await socket.emit(GameMsg.DEPLOY)
      allDeploys.forEach((deploy) => {
        const sender = deploy.sender
        const playerSid = playerStorage.getSocketId(sender)
        console.log(`\n\n DEPLOYS SENT TO: SID:${playerSid} ID:${sender} \n\n`)
        socket.to(playerSid).timeout(TIMEOUT).emitWithAck(
          GameMsg.DEPLOY, 
          allDeploys
            .filter(x => x.sender !== sender)
            .map(x => x as GameDeployMsg))
      })
      // await socket
      //   .broadcast
      //   .timeout(TIMEOUT)
      //   .emitWithAck(GameMsg.DEPLOY, allDeploys.map(value => value as GameDeployMsg));
    }
    ack();
  });

  socket.on(GameMsg.QUERY, async (p: GameQueryMsg, ack: Ack) => {
    msgLog.register(p);

    const allQueries = msgLog.findMessageListForTurn(p.turn, p.event);

    // console.log(`\n\nQUERIES LEN: ${allQueries.length}`)
    // allQueries.forEach(query => {
    //   console.log(`\nQUERY LIST ITEM: ${query}\n\n`);
    // });
    // console.log(`\n\nGOT A QUERY FROM:${p.sender}\n\n`);

    if ( allQueries.length === MAX_PLAYERS - 1) {

      console.log(`\n\nBROADCASTING QUERIES\n\n`)
      await new Promise(resolve => setTimeout(resolve, BROADCAST_TIMEOUT));
      
      // TODO why not the third one??
      allQueries.forEach( async (deploy) => {
        const sender = deploy.sender
        const playerSid = playerStorage.getSocketId(sender)
        console.log(`\n\n QUERIES SENT TO: SID:${playerSid} ID:${sender} \n\n`)
        await socket.to(playerSid).timeout(TIMEOUT).emitWithAck(
          GameMsg.QUERY, 
          allQueries
            .filter(x => x.sender !== sender)
            .map(x => x as GameQueryMsg))
      })

      // await socket
      //   .broadcast
      //   .timeout(TIMEOUT)
      //   .emitWithAck(GameMsg.QUERY, allQueries.map(value => value as GameQueryMsg));
      // ack();
    }
    ack();
  });

  socket.on(GameMsg.ANSWER, async (p: GameAnswerMsg, ack: Ack) => {
    msgLog.register(p);
     
    const allAnswers = msgLog.findMessageListForTurn(p.turn, p.event);

    console.log(`\n\nGOT AN ANSWER FROM:${p.sender}\n\n`)

    if ( allAnswers.length === MAX_PLAYERS - 1) {
      console.log(`\n\nBROADCASTING ANSWERS\n\n`)
      await new Promise(resolve => setTimeout(resolve, BROADCAST_TIMEOUT));
      await socket
        .broadcast
        .timeout(TIMEOUT)
        .emitWithAck(GameMsg.ANSWER, allAnswers.map(value => value as GameAnswerMsg));
      ack();
    }
  });

  socket.on(GameMsg.UPDATE, async (p: GameUpdateMsg, ack: Ack) => {
    msgLog.register(p);

    const allUpdates = msgLog.findMessageListForTurn(p.turn, p.event);

    if ( allUpdates.length === MAX_PLAYERS - 1) {
      await new Promise(resolve => setTimeout(resolve, BROADCAST_TIMEOUT));
      await socket
        .broadcast
        .timeout(TIMEOUT)
        .emitWithAck(GameMsg.UPDATE, allUpdates.map(value => value as GameUpdateMsg));
       ack();
    }
  });

  socket.on(GameMsg.REPORT, async (p: GameReportMsg, ack: Ack) => {
    msgLog.register(p);
    
    console.log("\n\nCREATE REPORT\n\n")
    const allReports = msgLog.findMessageListForTurn(p.turn, p.event);

    if ( allReports.length === MAX_PLAYERS - 1) {
      await new Promise(resolve => setTimeout(resolve, BROADCAST_TIMEOUT));
      await socket
        .broadcast
        .timeout(TIMEOUT)
        .emitWithAck(GameMsg.REPORT, allReports.map(value => value as GameReportMsg));
       ack();
    }
  });

  socket.on(GameMsg.READY, async (ack: Ack) => {
    const game = getGameOrNewOne(socket.nsp);
    const playerIndex = game.readyPlayer(socket.data.id as Player);
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

