import { Server as HttpServer } from 'node:http';
import { Server } from 'socket.io';
import { addGameNamespace } from './sockets/game.js';
import { addLobby } from './sockets/lobby.js';

export function addIoSockets(server: HttpServer): Server {
  let io = new Server(server)

  io.on('connection', (socket) => {
    // console.log("User connection", socket.id)
    console.log(socket.handshake.auth);
  });


  io = addLobby(io);
  io = addGameNamespace(io);

  return io
}
