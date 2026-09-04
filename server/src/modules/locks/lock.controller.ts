import { Request, Response, NextFunction } from 'express';
import * as lockService from './lock.service';
import { StatusCodes } from 'http-status-codes/build/cjs/status-codes';

export const lockMonthHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { month } = req.body;
    if (!month) return res.status(StatusCodes.BAD_REQUEST).json({ error: 'month is required' });

    const lock = await lockService.lockMonth(req.userId!, month);
    res.status(StatusCodes.CREATED).json(lock);
  } catch (err) {
    next(err);
  }
};

export const unlockMonthHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { month } = req.params;
    if (typeof month !== 'string' || !month) {
      return res.status(StatusCodes.BAD_REQUEST).json({ error: 'month is required' });
    }

    await lockService.unlockMonth(req.userId!, month);
    res.status(StatusCodes.OK).json({ message: `${month} unlocked` });
  } catch (err) {
    next(err);
  }
};

export const listLocksHandler = async (req: Request, res: Response, next: NextFunction) => {
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

    const months = await lockService.listLockedMonths(req.userId!, parsedPage, parsedPageSize);
    res.status(StatusCodes.OK).json(months);
  } catch (err) {
    next(err);
  }
};