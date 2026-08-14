import type { Request, Response, NextFunction } from 'express';
import { AuthError } from '../modules/auth/auth.service';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof AuthError) {
    return res.status(err.statusCode).json({ error: err.message });
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
};