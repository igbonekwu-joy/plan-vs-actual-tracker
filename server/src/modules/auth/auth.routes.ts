import { Router } from 'express';
import { signupHandler, loginHandler, refreshTokenHandler, logoutHandler } from './auth.controller';

const router: Router = Router();

router.post('/signup', signupHandler);
router.post('/login', loginHandler);
router.post('/refresh', refreshTokenHandler);
router.post('/logout', logoutHandler);

export default router;