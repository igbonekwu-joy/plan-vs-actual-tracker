import { HttpError } from "../../errors/HttpError";
import { Category } from "../../models/Category";
import { ERROR, SUCCESS } from "../../constants/messages";

export const createCategory = async (userId: string, name: string) => {
  try {
    await Category.create({ userId, name });
    return { message: SUCCESS.category.created };
  } catch (err: any) {
    if (err.code === 11000) throw new HttpError(ERROR.category.alreadyExists, 409);
    throw err;
  }
};

export const listCategories = async (userId: string) => {
  return Category.find({ userId })
    .select({ _id: 0, name: 1, createdAt: 1, updatedAt: 1 })
    .sort({ name: 1 });
};