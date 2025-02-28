import { GameAnswerMsg, GameMsg, GameNspClientToServerEvents, GameNspServerToClientEvents, GameQueryMsg, GameUpdateMsg } from 'client/types';
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


function registerGameHandlers(nsp: GameNsp, socket: GameSocket) {

  /*///////////////////////////////////////////////////////////////
                          BROADCASTING
  //////////////////////////////////////////////////////////////*/
  socket.on(GameMsg.QUERY, async (p: GameQueryMsg, ack: Ack) => {
    await new Promise((res, rej) => {
      socket
        .broadcast
        .timeout(1000)
        .emit(GameMsg.QUERY, p, res);
    })
    ack();
  })

  socket.on(GameMsg.ANSWER, async (p: GameAnswerMsg, ack: Ack) => {
    await new Promise((res, rej) => {
      socket
        .broadcast
        .timeout(1000)
        .emit(GameMsg.ANSWER, p, res);
    })
    ack();
  });

  socket.on(GameMsg.UPDATE, async (p: GameUpdateMsg, ack: Ack) => {
    await new Promise((res, rej) => {
      socket
        .broadcast
        .timeout(1000)
        .emit(GameMsg.UPDATE, p, res);
    })
    ack();
  });

  // socket.on(GameMsg.REPORT, (msg: any) => {
  //   socket.broadcast.emit(GameMsg.REPORT, msg)
  // })

  socket.on(GameMsg.TURN_END, async (ack: Ack) => {
    console.log("SOMEONE IS FINISHIN")
    await new Promise((res, rej) => {
      socket
        .broadcast
        .timeout(1000)
        .emit(GameMsg.TURN_END, res);
    })
    const game = getGameOrNewOne(socket.nsp);
    await game.nextTurn();
    ack();
  });

  socket.on(GameMsg.READY, async (ack: Ack) => {
    const game = getGameOrNewOne(socket.nsp);
    ack();
    game.readyPlayer(socket.id as Player);
  })

}

export function addGameNamespace(server: Server): Server {

  // nsp ~ /game/V1StGXR8_Z5jdHi6B2myT
  const gameNsp: GameNsp = server.of(/^\/game\/[a-zA-Z0-9_\-]+$/);

  gameNsp.on('connection', async (socket) => {
    const game = getGameOrNewOne(socket.nsp);
    registerGameHandlers(gameNsp, socket);
    console.log(`[${socket.nsp.name}][${socket.id}] User connection`)
    await game.addPlayer(socket.id as Player);
  });

  return server;

}
