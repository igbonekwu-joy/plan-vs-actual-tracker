import { Request, Response, NextFunction } from 'express';
import * as categoryService from './category.service';
import { ERROR } from '../../constants/messages';

export const createCategoryHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: ERROR.category.nameRequired });

    const category = await categoryService.createCategory(req.userId!, name);
    res.status(201).json(category);
  } catch (err) {
    next(err);
  }
};

export const listCategoriesHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await categoryService.listCategories(req.userId!);
    res.status(200).json(categories);
  } catch (err) {
    next(err);
  }
};