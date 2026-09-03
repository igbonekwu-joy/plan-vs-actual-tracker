import { env } from "../config/env";
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export const generateAccessToken = (user: { id: string; username: string; role: string; is_active: boolean }) => {
    return jwt.sign(
        { id: user.id, username: user.username, role: user.role, is_active: user.is_active },
        env().JWT_SECRET,
        { expiresIn: env().JWT_EXPIRES_IN }
    );
};

export function generateCSRFToken() {
  return crypto.randomBytes(32).toString("hex");
}