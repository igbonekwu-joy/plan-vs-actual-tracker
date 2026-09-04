import { Request, Response, NextFunction } from 'express';
import * as categoryService from './category.service';
import { ERROR } from '../../constants/messages';
import { StatusCodes } from 'http-status-codes';

export const createCategoryHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(StatusCodes.BAD_REQUEST).json({ error: ERROR.category.nameRequired });

    const category = await categoryService.createCategory(req.userId!, name);
    res.status(StatusCodes.CREATED).json(category);
  } catch (err) {
    next(err);
  }
};

export const listCategoriesHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await categoryService.listCategories(req.userId!);
    res.status(StatusCodes.OK).json(categories);
  } catch (err) {
    next(err);
  }
};