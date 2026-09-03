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

export const createOrUpdatePlan = async (
    userId: string,
    categoryId: string,
    month: string,
    targetAmount: number
) => {
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