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

export const listLockedMonths = async (userId: string) => {
  const locks = await Lock.find({ userId }).sort({ month: 1 });
  return locks.map((l) => l.month);
};

export const isMonthLocked = async (userId: string, month: string): Promise<boolean> => {
  const lock = await Lock.findOne({ userId, month });
  return !!lock;
};