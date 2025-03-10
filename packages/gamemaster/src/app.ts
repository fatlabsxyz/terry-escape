import bodyParser from "body-parser";
import express, { NextFunction, Request, Response } from "express";
import {
  errorHandlerMiddleware,
  // marshalResponseMiddleware,
  notFoundMiddleware,
} from "./middlewares/index.js";
// import { relayerRouter } from "./routes/index.js";

// Initialize the express app
const app: express.Express = express();

// Apply middleware and routes

// json parser
app.use(bodyParser.json());

// app.use(marshalResponseMiddleware);

// ping route
app.use("/ping", (req: Request, res: Response, next: NextFunction) => {
  res.send("pong");
  next();
});

// // route
// app.use("/route", routeRouter);

// Error and 404 handling
app.use([errorHandlerMiddleware, notFoundMiddleware]);

export { app };
