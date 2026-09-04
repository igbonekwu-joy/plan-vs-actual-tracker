import express from 'express';
import type { Application } from 'express';
import cookieParser from 'cookie-parser';
import authRoutes from './modules/auth/auth.routes';
import categoryRoutes from './modules/categories/category.routes';
import planRoutes from './modules/plans/plan.routes';
import actualRoutes from './modules/actuals/actual.routes';
import lockRoutes from './modules/locks/lock.routes';
import reportRoutes from './modules/report/report.route';
import { authGuard } from './middleware/authGuard';
import { errorHandler } from './middleware/errorHandler';
import { attachCSRF } from './middleware/csrfHandler';

const app: Application = express();
app.use(express.json());
app.use(cookieParser());
app.use(attachCSRF);

app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/actuals', actualRoutes);
app.use('/api/locks', lockRoutes);
app.use('/api/report', reportRoutes);
app.get('/api/protected', authGuard, (req, res) => {
	res.status(200).json({ userId: req.userId });
});

app.use(errorHandler);

export default app;