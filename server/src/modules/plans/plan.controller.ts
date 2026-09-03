import { Request, Response, NextFunction } from 'express';
import * as planService from './plan.service';
import { StatusCodes } from 'http-status-codes';
import { SUCCESS } from '../../constants/messages';

export const upsertPlanHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { categoryId, month, targetAmount } = req.body;

    if (!categoryId || !month || targetAmount === undefined) {
      return res.status(StatusCodes.BAD_REQUEST).json({ error: 'categoryId, month, and targetAmount are required' });
    }
    if (typeof targetAmount !== 'number' || targetAmount < 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({ error: 'targetAmount must be a non-negative number' });
    }

    await planService.createOrUpdatePlan(req.userId!, categoryId, month, targetAmount);
    res.status(StatusCodes.OK).json({ status: 'success', message: SUCCESS.plan.upserted });
  } catch (err) {
    next(err);
  }
};

export const listPlansHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startMonth, endMonth } = req.query as { startMonth?: string; endMonth?: string };
    const plans = await planService.listPlans(req.userId!, startMonth, endMonth);
    res.status(StatusCodes.OK).json(plans);
  } catch (err) {
    next(err);
  }
};