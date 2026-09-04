import { HttpError } from '../../errors/HttpError';
import { Lock } from '../../models/Lock';
import { StatusCodes } from 'http-status-codes';

export const lockMonth = async (userId: string, month: string) => {
  try {
    return await Lock.create({ userId, month });
  } catch (err: any) {
    if (err.code === 11000) throw new HttpError(`${month} is already locked`, StatusCodes.CONFLICT);
    throw err;
  }
};

export const unlockMonth = async (userId: string, month: string) => {
  const result = await Lock.findOneAndDelete({ userId, month });
  if (!result) throw new HttpError(`${month} is not locked`, StatusCodes.NOT_FOUND);
  return result;
};

export const listLockedMonths = async (userId: string, page?: number, pageSize?: number) => {
  const locksQuery = Lock.find({ userId }).sort({ month: 1 });

  if (page === undefined || pageSize === undefined) {
    const locks = await locksQuery;
    return locks.map((l) => l.month);
  }

  const totalItems = await Lock.countDocuments({ userId });
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(page, totalPages);
  const locks = await locksQuery.skip((currentPage - 1) * pageSize).limit(pageSize);

  return {
    items: locks.map((l) => l.month),
    pagination: {
      page: currentPage,
      pageSize,
      totalItems,
      totalPages,
      hasPrevious: currentPage > 1,
      hasNext: currentPage < totalPages,
    },
  };
};

export const isMonthLocked = async (userId: string, month: string): Promise<boolean> => {
  const lock = await Lock.findOne({ userId, month });
  return !!lock;
};