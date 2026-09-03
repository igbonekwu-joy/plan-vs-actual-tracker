import { Schema, model, Document, Types } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  userId: Types.ObjectId;
  createdAt: Date;
}

const categorySchema = new Schema<ICategory>({
  name: { type: String, required: true, trim: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

categorySchema.index({ userId: 1, name: 1 }, { unique: true });

export const Category = model<ICategory>('Category', categorySchema);