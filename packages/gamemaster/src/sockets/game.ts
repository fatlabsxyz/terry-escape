import { Server } from 'socket.io';

export function addGameNamespace(server: Server): Server {

  //=> "V1StGXR8_Z5jdHi6B2myT"
  const gameNsp = server.of(/^\/game\/[a-zA-Z0-9_\-]+$/);
  gameNsp.on('connection', (socket) => {
    console.log(`[game:=${socket.nsp.name}] User connection`)
  });

  return server;

}
