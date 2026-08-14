import mongoose from 'mongoose';
import { env } from './env';

export const connectDB = async () => {
  const uri = env().DB_URI;
  if (!uri) {
    throw new Error('DB_URI is not defined in environment variables');
  }

  try {
    await mongoose.connect(uri);
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};