import { Request, Response, NextFunction } from 'express';
import * as reportService from './report.service';

export const getReportHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startMonth, endMonth } = req.query as { startMonth?: string; endMonth?: string };
    const report = await reportService.getReport(req.userId!, startMonth!, endMonth!);
    res.status(200).json(report);
  } catch (err) {
    next(err);
  }
};