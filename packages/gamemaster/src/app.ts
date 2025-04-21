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

const SECRET_KEY = 'test-key';

// Initialize the express app
const app: express.Express = express();

// Apply middleware and routes

// CORS middleware
app.use(cors());

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

// Error and 404 handling
app.use([errorHandlerMiddleware, notFoundMiddleware]);

export { app };
