import type { Request, Response, NextFunction } from 'express';
import * as authService from './auth.service';
import { env } from '../../config/env';

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
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const user = await authService.signup(email, password);
    res.status(201).json({ id: user._id, email: user.email });
  } catch (err) {
    next(err);
  }
};

export const loginHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const { access_token, refresh_token } = await authService.login(email, password);
    setAuthCookies(res, access_token, refresh_token);
    res.status(200).json({ access_token, refresh_token });
  } catch (err) {
    next(err);
  }
};

export const refreshTokenHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Refresh Token is required' });
    } 

    const { accessToken, refreshToken } = await authService.refresh(token);
  setAuthCookies(res, accessToken, refreshToken);
    return res.status(200).json({ token: accessToken, refresh_token: refreshToken });
  } catch (err) {
    next(err);
  }
};
