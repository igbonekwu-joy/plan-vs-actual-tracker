import type { Request, Response, NextFunction } from 'express';
import * as authService from './auth.service';

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
    const { token } = await authService.login(email, password);
    res.status(200).json({ token });
  } catch (err) {
    next(err);
  }
};