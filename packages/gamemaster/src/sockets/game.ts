import { Server } from 'socket.io';
import { getGameOrNewOne, Player, Games } from '../game.js';

export function addGameNamespace(server: Server): Server {

  //=> "V1StGXR8_Z5jdHi6B2myT"
  const gameNsp = server.of(/^\/game\/[a-zA-Z0-9_\-]+$/);

  gameNsp.on('connection', (socket) => {
    const game = getGameOrNewOne(socket.nsp);
    game.addPlayer(socket.id as Player)
    console.log(`[${socket.nsp.name}] User connection`)
  });



  return server;

}
