import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../../models/User';
import { AuthError } from '../../errors/AuthError';


export const signup = async (email: string, password: string) => {
  const existing = await User.findOne({ email });
  if (existing) throw new AuthError('Email already registered', 409);

  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({ email, password: hashed });
  return user;
};

export const login = async (email: string, password: string) => {
  const user = await User.findOne({ email });
  if (!user) throw new AuthError('Invalid credentials', 401);

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new AuthError('Invalid credentials', 401);

  const token = jwt.sign(
    { userId: user._id },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1d' }
  );
  return { user, token };
};