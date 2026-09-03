import { Request, Response, NextFunction } from 'express';
import * as planService from './plan.service';

export const upsertPlanHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { categoryId, month, targetAmount } = req.body;

    if (!categoryId || !month || targetAmount === undefined) {
      return res.status(400).json({ error: 'categoryId, month, and targetAmount are required' });
    }
    if (typeof targetAmount !== 'number' || targetAmount < 0) {
      return res.status(400).json({ error: 'targetAmount must be a non-negative number' });
    }

    const plan = await planService.createOrUpdatePlan(req.userId!, categoryId, month, targetAmount);
    res.status(200).json(plan);
  } catch (err) {
    next(err);
  }
};

export const listPlansHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startMonth, endMonth } = req.query as { startMonth?: string; endMonth?: string };
    const plans = await planService.listPlans(req.userId!, startMonth, endMonth);
    res.status(200).json(plans);
  } catch (err) {
    next(err);
  }
};