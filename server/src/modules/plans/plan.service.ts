import { HttpError } from "../../errors/HttpError";
import { Category } from "../../models/Category";
import { Plan } from "../../models/Plan";

const assertNotLocked = async (userId: string, month: string) => {
    // COME BACK TO: replace with real lock check once I implement lock feature
    return;
};

const assertCategoryOwnership = async (userId: string, categoryId: string) => {
    const category = await Category.findOne({ _id: categoryId, userId });
    if (!category) throw new HttpError('Category not found', 404);
};

const assertMonthIsCurrentOrFuture = (month: string) => {
    const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(month);
    if (!match) {
        throw new HttpError('month must be in YYYY-MM format', 400);
    }

    const now = new Date();
    const planYear = Number(match[1]);
    const planMonth = Number(match[2]);
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    if (planYear < currentYear || (planYear === currentYear && planMonth < currentMonth)) {
        throw new HttpError('Plan month cannot be in the past', 400);
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

export const listPlans = async (userId: string, startMonth?: string, endMonth?: string) => {
    const filter: any = { userId };
    if (startMonth && endMonth) {
    filter.month = { $gte: startMonth, $lte: endMonth };
    }
    return Plan
        .find(filter)
        .populate('categoryId', 'name')
        .sort({ month: 1 });
};