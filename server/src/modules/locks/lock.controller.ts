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
    const months = await lockService.listLockedMonths(req.userId!);
    res.status(StatusCodes.OK).json(months);
  } catch (err) {
    next(err);
  }
};