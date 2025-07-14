import { Server as HttpServer } from 'node:http';
import { Server, Socket } from 'socket.io';
import { addGameNamespace } from './sockets/game.js';
import { addLobby } from './sockets/lobby.js';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { FRONTEND_URLS } from  './app.js'


export function addIoSockets(server: HttpServer): Server {
  let io = new Server(server, {
    maxHttpBufferSize: 8e7, // 80 mb (8 * 7 bytes)
    pingTimeout: 300000, // 5 minutes
    pingInterval: 150000, // 2.5 minutes
    cors: {
      origin: FRONTEND_URLS[0],
      methods: ["GET", "POST"]
    }
  })

  io.on('connection', (socket: Socket) => {

    jwt.verify(socket.handshake.auth.token, process.env.JWT_SECRET || 'test-key', (err: jwt.VerifyErrors | null, decoded: unknown) => {
      if (err) {
        console.log('Invalid Token:', err.message);
        return;
      }
      const data = decoded as JwtPayload;
      console.log(`user ${data.name} connected with id: ${data.id}`);
    }); 
  });

  io = addLobby(io);
  io = addGameNamespace(io);

    
  return io
}
