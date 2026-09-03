import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AuthError } from '../errors/AuthError';

export const authGuard = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AuthError('No token provided', 401));
  }

  const token = authHeader.slice('Bearer '.length);

  try {
    const decoded = jwt.verify(token, env().JWT_SECRET);
    if (
      typeof decoded !== 'object' ||
      decoded === null ||
      !('id' in decoded) ||
      typeof decoded.id !== 'string'
    ) {
      return next(new AuthError('Invalid or expired token', 401));
    }

    req.userId = decoded.id;
    next();
  } catch {
    return next(new AuthError('Invalid or expired token', 401));
  }
};