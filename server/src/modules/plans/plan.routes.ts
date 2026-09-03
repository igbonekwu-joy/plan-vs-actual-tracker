import { Router } from 'express';
import { authGuard } from '../../middleware/authGuard';
import { upsertPlanHandler, listPlansHandler } from './plan.controller';

const router = Router();
router.use(authGuard);

router.put('/', upsertPlanHandler); 
router.get('/', listPlansHandler);

export default router;