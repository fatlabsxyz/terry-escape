import { NextFunction, Request, Response } from "express";

/**
 * Middleware to handle 404 (Not Found) responses.
 * If no response has been sent, it returns a 404 error.
 *
 * @param {Request} _req - Express request object (unused).
 * @param {Response} res - Express response object.
 * @param {NextFunction} next - Express next function.
 */
export function notFoundMiddleware(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!res.writableFinished) {
    res.status(404).json({ error: "Route not found" });
  }
  next();
}
