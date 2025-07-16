import bodyParser from "body-parser";
import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import {
  errorHandlerMiddleware,
  // marshalResponseMiddleware,
  notFoundMiddleware,
  validateAuthMiddleware,
} from "./middlewares/index.js";
import jwt from "jsonwebtoken";
import { nanoid } from "nanoid";
import { AuthRequestData } from "./types.js";
// import { relayerRouter } from "./routes/index.js";
import { listGames, createGame, joinGame, getGameStatus } from "./api/games.js";

// Get CORS origins from environment or use defaults
const CORS_ORIGINS = process.env.CORS_ORIGINS 
  ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
  : ["http://localhost:8000", "http://localhost"];

export const FRONTEND_URLS = CORS_ORIGINS;

const SECRET_KEY = process.env.JWT_SECRET || 'test-key';

// Initialize the express app
const app: express.Express = express();

// Apply middleware and routes

// CORS middleware
const options: cors.CorsOptions = {
  origin: FRONTEND_URLS
};
app.use(cors(options));

// json parser
app.use(bodyParser.json());

// app.use(marshalResponseMiddleware);

// ping route
app.use("/ping", (req: Request, res: Response, next: NextFunction) => {
  res.send("pong");
  next();
});

// auth route, generates a jwt token with a unique nano-id
app.post('/auth', validateAuthMiddleware, (req: Request, res: Response, next: NextFunction) => {
  const data = req.body as AuthRequestData;
  const payload =  {
    id: nanoid(),
    name: data.name,
  };

  const token = jwt.sign(
    payload,
    SECRET_KEY
  );
  
  // create jwt and return it
  res.json({
    message: 'Authenticated successfully',
    token: token
  });

  next();
});

// Game management routes
app.get('/games', listGames);
app.post('/games/create', createGame);
app.post('/games/:gameId/join', joinGame);
app.get('/games/:gameId/status', getGameStatus);

// Error and 404 handling
app.use([errorHandlerMiddleware, notFoundMiddleware]);

export { app };
