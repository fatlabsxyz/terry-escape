import { Server as HttpServer } from 'node:http';
import { Server } from 'socket.io';
import { addGameNamespace } from './sockets/game.js';

export function addIoSockets(server: HttpServer): Server {
  const io = new Server(server)

  io.on('connection', (socket) => {
    console.log("User connection")
  });

  addGameNamespace(io);

  return io
}
