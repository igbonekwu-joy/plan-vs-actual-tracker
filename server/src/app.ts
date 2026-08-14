import express from 'express';
import type { Application } from 'express';
import authRoutes from './modules/auth/auth.routes';
import { errorHandler } from './middleware/errorHandler';

const app: Application = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use(errorHandler);

export default app;