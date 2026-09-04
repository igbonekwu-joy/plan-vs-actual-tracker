import { Request, Response, NextFunction } from 'express';
import { parse } from 'csv-parse/sync';
import * as actualService from './actual.service';

export const createActualHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { categoryId, month, amount, note } = req.body;

    if (!categoryId || !month || amount === undefined) {
      return res.status(400).json({ error: 'categoryId, month, and amount are required' });
    }
    if (typeof amount !== 'number' || amount < 0) {
      return res.status(400).json({ error: 'amount must be a non-negative number' });
    }

    const actual = await actualService.createActual(req.userId!, categoryId, month, amount, note);
    res.status(201).json(actual);
  } catch (err) {
    next(err);
  }
};

export const listActualsHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startMonth, endMonth } = req.query as { startMonth?: string; endMonth?: string };
    const actuals = await actualService.listActuals(req.userId!, startMonth, endMonth);
    res.status(200).json(actuals);
  } catch (err) {
    next(err);
  }
};

// export const importActualsHandler = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ error: 'CSV file is required (field name: file)' });
//     }

//     const records = parse(req.file.buffer.toString(), {
//       columns: true,
//       skip_empty_lines: true,
//       trim: true,
//     });

//     const inserted = await actualService.importActualsFromCsv(req.userId!, records);
//     res.status(201).json({ imported: inserted.length });
//   } catch (err) {
//     next(err);
//   }
// };