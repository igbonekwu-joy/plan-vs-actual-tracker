import { Request, Response, NextFunction } from 'express';
import * as reportService from './report.service';

export const getReportHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startMonth, endMonth, page, pageSize } = req.query as {
      startMonth?: string;
      endMonth?: string;
      page?: string;
      pageSize?: string;
    };
    const report = await reportService.getReport(
      req.userId!,
      startMonth!,
      endMonth!,
      page === undefined ? 1 : Number(page),
      pageSize === undefined ? 50 : Number(pageSize),
    );
    res.status(200).json(report);
  } catch (err) {
    next(err);
  }
};