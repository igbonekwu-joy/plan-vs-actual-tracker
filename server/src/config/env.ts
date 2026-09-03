import dotenv from 'dotenv';
import type { SignOptions } from 'jsonwebtoken';

dotenv.config();

export const env = (): { PORT: string; DB_URI: string; NODE_ENV: string; JWT_SECRET: string; JWT_EXPIRES_IN: NonNullable<SignOptions['expiresIn']> } => {
    const PORT: string = process.env.PORT || '3000';
    const DB_URI: string = process.env.DB_URI || '';
    const NODE_ENV: string = process.env.NODE_ENV || 'development';
    const JWT_SECRET: string = process.env.JWT_SECRET || 'test-secret';
    const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '1h') as NonNullable<SignOptions['expiresIn']>;
    
    return { PORT, DB_URI, NODE_ENV, JWT_SECRET, JWT_EXPIRES_IN };
};