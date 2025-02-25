// import { NextFunction, Request, Response } from "express";
// import { RelayerError } from "../exceptions/base.exception.js";
// import { RelayerMarshall } from "../types.js";

// /**
//  * Middleware to attach a marshaller function to the response locals.
//  * This function formats the response data in a standardized way.
//  *
//  * @param {Request} _req - Express request object (unused).
//  * @param {Response} res - Express response object.
//  * @param {NextFunction} next - Express next function.
//  */
// export function marshalResponseMiddleware(
//   _req: Request,
//   res: Response,
//   next: NextFunction,
// ) {
//   res.locals.marshalResponse = (data: RelayerMarshall) => ({
//     ...data.toJSON(),
//   });
//   next();
// }


