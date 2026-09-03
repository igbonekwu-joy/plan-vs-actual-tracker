import type { Request, Response, NextFunction } from 'express';
import { HttpError } from '../errors/HttpError';
import mongoose from 'mongoose';
import { StatusCodes } from 'http-status-codes';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof HttpError) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  if (err instanceof mongoose.Error.ValidationError) {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(StatusCodes.BAD_REQUEST).json({ error: messages.join(', ') });
  }

  console.error(err);
  res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Internal server error' });

  next();
};