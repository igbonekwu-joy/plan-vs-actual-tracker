import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { HttpError } from '../errors/HttpError';

export const authGuard = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (authHeader && !authHeader.startsWith('Bearer ')) {
    return next(new HttpError('Unauthenticated', 401));
  }

  const token = authHeader
    ? authHeader.slice('Bearer '.length)
    : req.cookies?.access_token;

  if (!token) {
    return next(new HttpError('Unauthenticated', 401));
  }

  try {
    const decoded = jwt.verify(token, env().JWT_SECRET);
    if (
      typeof decoded !== 'object' ||
      decoded === null ||
      !('id' in decoded) ||
      typeof decoded.id !== 'string'
    ) {
      return next(new HttpError('Invalid or expired token', 401));
    }

    req.userId = decoded.id;
    next();
  } catch {
    return next(new HttpError('Invalid or expired token', 401));
  }
};