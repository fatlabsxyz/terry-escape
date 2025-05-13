import { Server as HttpServer } from 'node:http';
import { Server, Socket } from 'socket.io';
import { addGameNamespace } from './sockets/game.js';
import { addLobby } from './sockets/lobby.js';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { FRONTEND_URLS } from  './app.js'


export function addIoSockets(server: HttpServer): Server {
  let io = new Server(server, {
      maxHttpBufferSize: 2e7, // 20 mb (2 * 7 zeroes)
      cors: {
        origin: FRONTEND_URLS[0],
        methods: ["GET", "POST"]
      }
    })

  io.on('connection', (socket: Socket) => {
    // console.log("User connection", socket.id)
    console.log(`user connected with token: ${socket.handshake.auth.token}`);
    
    const SECRET_KEY = 'test-key';
    jwt.verify(socket.handshake.auth.token, SECRET_KEY, (err: jwt.VerifyErrors | null, decoded: unknown) => {
      if (err) {
        console.log('Invalid Token')
      }
      const data = decoded as JwtPayload; 
      console.log(`id: ${data.id}`);
      console.log(`username: ${data.name}`);
    });
  });

  io = addLobby(io);
  io = addGameNamespace(io);

    
  return io
}
