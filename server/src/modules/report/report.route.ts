import { Router } from 'express';
import { authGuard } from '../../middleware/authGuard';
import { getReportHandler } from './report.controller';

const router = Router();
router.use(authGuard);

router.get('/', getReportHandler);

export default router;