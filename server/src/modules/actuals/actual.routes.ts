import { Router } from 'express';
import multer from 'multer';
import { authGuard } from '../../middleware/authGuard';
import { createActualHandler, importActualsHandler, listActualsHandler } from './actual.controller';

const upload = multer({ storage: multer.memoryStorage() });

const router = Router();
router.use(authGuard);

router.post('/', createActualHandler);
router.get('/', listActualsHandler);
router.post('/import', upload.single('file'), importActualsHandler);

export default router;