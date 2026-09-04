import { Router } from 'express';
import { authGuard } from '../../middleware/authGuard';
import { lockMonthHandler, unlockMonthHandler, listLocksHandler } from './lock.controller';

const router = Router();
router.use(authGuard);

router.post('/', lockMonthHandler);          
router.delete('/:month', unlockMonthHandler); 
router.get('/', listLocksHandler);

export default router;