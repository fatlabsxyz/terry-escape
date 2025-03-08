import { GameAnswerMsg, GameMsg, GameNspClientToServerEvents, GameNspServerToClientEvents, GameQueryMsg, GameReportMsg, GameUpdateMsg } from 'client/types';
import { Namespace, Server, Socket } from 'socket.io';
import { getGameOrNewOne, Player } from '../game.js';

type Ack = () => void;
interface InterServerEvents { }
interface SocketData { }

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


function registerGameHandlers(socket: GameSocket) {

  /*///////////////////////////////////////////////////////////////
                          BROADCASTING
  //////////////////////////////////////////////////////////////*/
  socket.on(GameMsg.QUERY, async (p: GameQueryMsg, ack: Ack) => {
    await socket
      .broadcast
      .timeout(1000)
      .emitWithAck(GameMsg.QUERY, p);
    ack();
  })

  socket.on(GameMsg.ANSWER, async (p: GameAnswerMsg, ack: Ack) => {
    socket
      .broadcast
      .timeout(1000)
      .emitWithAck(GameMsg.ANSWER, p);
    ack();
  });

  socket.on(GameMsg.UPDATE, async (p: GameUpdateMsg, ack: Ack) => {
    socket
      .broadcast
      .timeout(1000)
      .emitWithAck(GameMsg.UPDATE, p);
    ack();
  });

  socket.on(GameMsg.REPORT, async (p: GameReportMsg, ack: Ack) => {
    socket
      .broadcast
      .timeout(1000)
      .emitWithAck(GameMsg.REPORT, p);
    ack();
  });

  socket.on(GameMsg.READY, async (ack: Ack) => {
    const game = getGameOrNewOne(socket.nsp);
    game.readyPlayer(socket.id as Player);
    ack();
  })

}

export function addGameNamespace(server: Server): Server {

  // nsp ~ /game/V1StGXR8_Z5jdHi6B2myT
  const gameNsp: GameNsp = server.of(/^\/game\/[a-zA-Z0-9_\-]+$/);

  gameNsp.on('connection', async (socket) => {
    const game = getGameOrNewOne(socket.nsp);
    registerGameHandlers(socket);
    console.log(`[${socket.nsp.name}][${socket.id}] User connection`)
    game.addPlayer(socket.id as Player);
  });

  return server;

}
