import express from 'express';
import type { Application } from 'express';
import authRoutes from './modules/auth/auth.routes';
import { authGuard } from './middleware/authGuard';
import { errorHandler } from './middleware/errorHandler';

const app: Application = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
// app.get('/api/protected', authGuard, (req, res) => {
// 	res.status(200).json({ userId: req.userId });
// });
app.use(errorHandler);

export default app;