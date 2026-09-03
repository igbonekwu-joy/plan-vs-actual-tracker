import express from 'express';
import type { Application } from 'express';
import cookieParser from 'cookie-parser';
import authRoutes from './modules/auth/auth.routes';
import { authGuard } from './middleware/authGuard';
import { errorHandler } from './middleware/errorHandler';
import { attachCSRF } from './middleware/csrfHandler';

const app: Application = express();
app.use(express.json());
app.use(cookieParser());
app.use(attachCSRF);
app.use('/api/auth', authRoutes);
app.get('/api/protected', authGuard, (req, res) => {
	res.status(200).json({ userId: req.userId });
});
app.use(errorHandler);

export default app;