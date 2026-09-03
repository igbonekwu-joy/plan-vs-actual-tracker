import { Router } from 'express';
import { signupHandler, loginHandler, refreshTokenHandler } from './auth.controller';

const router: Router = Router();

router.post('/signup', signupHandler);
router.post('/login', loginHandler);
router.post('/refresh', refreshTokenHandler);

export default router;