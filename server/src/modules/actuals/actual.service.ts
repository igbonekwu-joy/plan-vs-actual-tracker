import { HttpError } from '../../errors/HttpError';
import { Actual } from '../../models/Actual';
import { Category } from '../../models/Category';
import { CsvRow } from '../../types/types';

const assertNotLocked = async (userId: string, month: string) => {
  // COME BACK TO THIS: replace with real lock check once Lock model exists
  return;
};

export const createActual = async (
  userId: string,
  categoryId: string,
  month: string,
  amount: number,
  note?: string
) => {
  const category = await Category.findOne({ _id: categoryId, userId });
  if (!category) throw new HttpError('Category not found', 404);

  await assertNotLocked(userId, month);

  return Actual.create({
    userId,
    categoryId,
    month,
    amount,
    ...(note !== undefined ? { note } : {}),
  });
};

export const listActuals = async (userId: string, startMonth?: string, endMonth?: string) => {
  const filter: any = { userId };
  if (startMonth && endMonth) {
    filter.month = { $gte: startMonth, $lte: endMonth };
  }
  return Actual.find(filter).select('-_id categoryId month amount note').populate('categoryId', 'name').sort({ month: 1 });
};

export const importActualsFromCsv = async (userId: string, rows: CsvRow[]) => {
  const monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/;
  const errors: string[] = [];
  const toInsert: any[] = [];

  // preload user's categories once to avoid N queries
  const categories = await Category.find({ userId });
  const categoryMap = new Map(categories.map((c) => [c.name.toLowerCase(), c._id]));

  rows.forEach((row, index) => {
    const rowNum = index + 2; // +2 accounts for header row + 0-index

    if (!monthRegex.test(row.month)) {
      errors.push(`Row ${rowNum}: invalid month format "${row.month}"`);
      return;
    }

    const categoryId = categoryMap.get(row.category?.trim().toLowerCase());
    if (!categoryId) {
      errors.push(`Row ${rowNum}: unknown category "${row.category}"`);
      return;
    }

    const amount = Number(row.amount);
    if (isNaN(amount) || amount < 0) {
      errors.push(`Row ${rowNum}: invalid amount "${row.amount}"`);
      return;
    }

    toInsert.push({ userId, categoryId, month: row.month, amount });
  });

  if (errors.length > 0) {
    throw new HttpError(`CSV validation failed: ${errors.join('; ')}`, 400);
  }

  return Actual.insertMany(toInsert);
};