import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../../models/User';
import { HttpError } from '../../errors/HttpError';
import { env } from '../../config/env';
import { generateAccessToken, generateRefreshToken, regenerateRefreshToken } from '../../utils/tokens';


export const signup = async (email: string, password: string) => {
  const existing = await User.findOne({ email });
  if (existing) throw new HttpError('Email already exists. Try logging in.', 409);

  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({ email, password: hashed });
  return user;
};

export const login = async (email: string, password: string) => {
  const user = await User.findOne({ email });
  if (!user) throw new HttpError('Invalid credentials', 401);

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new HttpError('Invalid credentials', 401);

  const access_token = generateAccessToken({ id: user._id.toString(), username: user.email, role: user.role, is_active: user.is_active });
  const refresh_token = await generateRefreshToken(user._id);

  return { user, access_token, refresh_token };
};

export const refresh = async (token: string) => {
  const regenerated = await regenerateRefreshToken(token);
  if (!regenerated) throw new HttpError('Invalid or expired refresh token', 401);

  return regenerated;
};
