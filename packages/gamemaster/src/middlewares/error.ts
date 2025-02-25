import { NextFunction, Request, Response } from "express";
import { GamemasterError } from "../exceptions.js";

/**
 * Middleware to handle errors and send appropriate responses.
 *
 * @param {Error} err - The error object.
 * @param {Request} _req - Express request object (unused).
 * @param {Response} res - Express response object.
 * @param {NextFunction} next - Express next function.
 */
export function errorHandlerMiddleware(
  err: Error,
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  if (err instanceof GamemasterError) {
    // TODO: error handling based on RelayerError subtypes should be done by checking `err.name`
    res.status(400).json({ error: err.toJSON() });
  } else {
    res.status(500).json({ error: "Internal Server Error" });
  }
  next();
}
