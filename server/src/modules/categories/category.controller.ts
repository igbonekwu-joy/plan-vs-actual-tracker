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
    const { page, pageSize } = req.query as { page?: string; pageSize?: string };
    let parsedPage: number | undefined;
    let parsedPageSize: number | undefined;
    if (page !== undefined || pageSize !== undefined) {
      parsedPage = page === undefined ? 1 : Number(page);
      parsedPageSize = pageSize === undefined ? 10 : Number(pageSize);
      if (
        !Number.isInteger(parsedPage) ||
        parsedPage < 1 ||
        !Number.isInteger(parsedPageSize) ||
        parsedPageSize < 1 ||
        parsedPageSize > 100
      ) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          error: 'page must be a positive integer and pageSize must be between 1 and 100',
        });
      }
    }

    const categories = await categoryService.listCategories(req.userId!, parsedPage, parsedPageSize);
    res.status(StatusCodes.OK).json(categories);
  } catch (err) {
    next(err);
  }
};