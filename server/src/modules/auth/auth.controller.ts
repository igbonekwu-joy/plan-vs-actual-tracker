import type { Request, Response, NextFunction } from 'express';
import * as authService from './auth.service';
import { env } from '../../config/env';
import { SUCCESS } from '../../constants/messages';
import { StatusCodes } from 'http-status-codes';

const setAuthCookies = (res: Response, accessToken: string, refreshToken: string) => {
  const secure = env().NODE_ENV === 'production';

  res.cookie('access_token', accessToken, {
    httpOnly: true,
    secure,
    sameSite: 'strict',
    maxAge: 60 * 60 * 1000,
  });
  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure,
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

export const signupHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(StatusCodes.BAD_REQUEST).json({ error: 'Email and password are required' });
    }
    await authService.signup(email, password);
    res.status(StatusCodes.CREATED).json({ message: SUCCESS.auth.signup });
  } catch (err) {
    next(err);
  }
};

export const loginHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const { accessToken, refreshToken } = await authService.login(email, password);
    setAuthCookies(res, accessToken, refreshToken);
    res.status(StatusCodes.OK).json({ message: SUCCESS.auth.login });
  } catch (err) {
    next(err);
  }
};

export const refreshTokenHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(StatusCodes.BAD_REQUEST).json({ error: 'Refresh Token is required' });
    } 

    const { accessToken, refreshToken } = await authService.refresh(token);
    setAuthCookies(res, accessToken, refreshToken);
    return res.status(StatusCodes.OK).json({ message: SUCCESS.auth.tokenRefreshed });
  } catch (err) {
    next(err);
  }
};
