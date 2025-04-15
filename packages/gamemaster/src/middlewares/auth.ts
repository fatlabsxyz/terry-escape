import express, {Request, Response, NextFunction} from 'express';
import {AuthRequestData} from './../types.js';
/**
 * Middleware to validate auth request format.
 * This function formats the response data in a standardized way.
 *
 * @param {Request} req - Express request object (unused).
 * @param {Response} res - Express response object.
 * @param {NextFunction} next - Express next function.
 */

export function validateAuthMiddleware(
  req: Request<{}, any, unknown>,
  res: Response,
  next: NextFunction,
): void {
  const data: unknown = req.body;
  
  if (!data || typeof data !== 'object') {
    res.status(400).json({ error: 'Invalid data format' });
    return; 
  }

  const pData = data as AuthRequestData; // potential data

  if (!('name' in pData) || typeof pData.name !== 'string' || pData.name.length === 0) {
    res.status(400).json({ error: 'Name is required'});
    return;
  }

  req.body = pData;
  next();
}
