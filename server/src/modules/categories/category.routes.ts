import { Router } from 'express';
import { authGuard } from '../../middleware/authGuard';
import { createCategoryHandler, listCategoriesHandler } from './category.controller';

const router: Router = Router();

router.use(authGuard); 

router.post('/', createCategoryHandler);
router.get('/', listCategoriesHandler);

export default router;