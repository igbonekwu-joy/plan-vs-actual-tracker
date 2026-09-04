// src/modules/report/report.service.ts
import mongoose from 'mongoose';
import { Plan } from '../../models/Plan';
import { Actual } from '../../models/Actual';
import { Category } from '../../models/Category';
import { HttpError } from '../../errors/HttpError';
import { ReportRow } from '../../types/types';

const monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/;

export const getReport = async (
  userId: string,
  startMonth: string,
  endMonth: string,
  page = 1,
  pageSize = 50,
) => {
  if (!startMonth || !endMonth) {
    throw new HttpError('startMonth and endMonth are required', 400);
  }
  if (!monthRegex.test(startMonth) || !monthRegex.test(endMonth)) {
    throw new HttpError('startMonth and endMonth must be in YYYY-MM format', 400);
  }
  if (startMonth > endMonth) {
    throw new HttpError('startMonth must not be after endMonth', 400);
  }
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
    throw new HttpError('page must be a positive integer and pageSize must be between 1 and 100', 400);
  }

  const userObjectId = new mongoose.Types.ObjectId(userId);

  const categories = await Category.find({ userId });
  const categoryNameMap = new Map(categories.map((c) => [c._id.toString(), c.name]));

  const plans = await Plan.find({ userId, month: { $gte: startMonth, $lte: endMonth } });

  const actualAggregates = await Actual.aggregate([
    { $match: { userId: userObjectId, month: { $gte: startMonth, $lte: endMonth } } },
    { $group: { _id: { categoryId: '$categoryId', month: '$month' }, total: { $sum: '$amount' } } },
  ]);

  const planMap = new Map<string, number>();
  plans.forEach((p) => {
    planMap.set(`${p.categoryId.toString()}|${p.month}`, p.targetAmount);
  });

  const actualMap = new Map<string, number>();
  actualAggregates.forEach((a) => {
    actualMap.set(`${a._id.categoryId.toString()}|${a._id.month}`, a.total);
  });

  // a row exists if either a plan or an actual exists for that category+month
  const allKeys = new Set<string>([...planMap.keys(), ...actualMap.keys()]);

  const rows: ReportRow[] = [];

  allKeys.forEach((key) => {
    const [categoryId, month] = key.split('|');
    if (!categoryId || !month) return;

    const plan = planMap.get(key) ?? 0; // missing plan defaults to 0 — same as an explicit $0 target
    const hasActual = actualMap.has(key);

    let actualDisplay: number | string;
    let varianceDisplay: number | string;
    let variancePercentDisplay: number | string;

    if (!hasActual) {
      // missing actual: show '-' everywhere
      actualDisplay = '-';
      varianceDisplay = '-';
      variancePercentDisplay = '-';
    } else {
      const actual = actualMap.get(key)!;
      const variance = actual - plan;
      actualDisplay = actual;
      varianceDisplay = variance;
      // plan = 0: variance% is undefined, show '-' rather than dividing by zero
      variancePercentDisplay = plan === 0 ? '-' : Number(((variance / plan) * 100).toFixed(2));
    }

    rows.push({
      categoryId,
      category: categoryNameMap.get(categoryId) ?? 'Unknown',
      month,
      plan,
      actual: actualDisplay,
      variance: varianceDisplay,
      variancePercent: variancePercentDisplay,
    });
  });

  rows.sort((a, b) => (a.month !== b.month ? a.month.localeCompare(b.month) : a.category.localeCompare(b.category)));

  // chart: net variance per month (rows with a missing actual contribute 0, not skipped,
  // so every month in range still appears on the chart even if fully unlogged)
  const monthlyNetVariance = new Map<string, number>();
  rows.forEach((r) => {
    const current = monthlyNetVariance.get(r.month) ?? 0;
    monthlyNetVariance.set(r.month, current + (typeof r.variance === 'number' ? r.variance : 0));
  });

  const sortedMonths = [...monthlyNetVariance.keys()].sort();
  const chart = {
    type: 'monthly_net_variance',
    labels: sortedMonths,
    data: sortedMonths.map((m) => monthlyNetVariance.get(m)!),
  };

  const totalRows = rows.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;

  return {
    rows: rows.slice(startIndex, startIndex + pageSize),
    chart,
    pagination: {
      page: currentPage,
      pageSize,
      totalRows,
      totalPages,
      hasPrevious: currentPage > 1,
      hasNext: currentPage < totalPages,
    },
  };
};