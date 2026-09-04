import { HttpError } from "../../errors/HttpError";
import { Category } from "../../models/Category";
import { Plan } from "../../models/Plan";
import { isMonthLocked } from "../locks/lock.service";
import { StatusCodes } from "http-status-codes";

const assertNotLocked = async (userId: string, month: string) => {
    const locked = await isMonthLocked(userId, month);
    if (locked) throw new HttpError(`Cannot modify plan: ${month} is locked`, StatusCodes.LOCKED);
};

const assertCategoryOwnership = async (userId: string, categoryId: string) => {
    const category = await Category.findOne({ _id: categoryId, userId });
    if (!category) throw new HttpError('Category not found', StatusCodes.NOT_FOUND);
};

const assertMonthIsCurrentOrFuture = (month: string) => {
    const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(month);
    if (!match) {
        throw new HttpError('month must be in YYYY-MM format', StatusCodes.BAD_REQUEST);
    }

    const now = new Date();
    const planYear = Number(match[1]);
    const planMonth = Number(match[2]);
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    if (planYear < currentYear || (planYear === currentYear && planMonth < currentMonth)) {
        throw new HttpError('Plan month cannot be in the past', StatusCodes.BAD_REQUEST);
    }
};

export const createOrUpdatePlan = async (
    userId: string,
    categoryId: string,
    month: string,
    targetAmount: number
) => {
    assertMonthIsCurrentOrFuture(month);
    await assertCategoryOwnership(userId, categoryId);
    await assertNotLocked(userId, month);

    const plan = await Plan.findOneAndUpdate(
    { userId, categoryId, month },
    { targetAmount },
    { upsert: true, new: true, runValidators: true }
    );
    return plan;
};

export const listPlans = async (
    userId: string,
    startMonth?: string,
    endMonth?: string,
    page?: number,
    pageSize?: number,
) => {
    const filter: any = { userId };
    if (startMonth && endMonth) {
    filter.month = { $gte: startMonth, $lte: endMonth };
    }
    const plansQuery = Plan
        .find(filter)
        .populate('categoryId', 'name')
        .sort({ month: 1 });

    if (page === undefined || pageSize === undefined) return plansQuery;

    const totalItems = await Plan.countDocuments(filter);
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const currentPage = Math.min(page, totalPages);
    const plans = await plansQuery.skip((currentPage - 1) * pageSize).limit(pageSize);

    return {
        items: plans,
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