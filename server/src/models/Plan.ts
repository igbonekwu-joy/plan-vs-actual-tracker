import { Schema, model, Document, Types } from 'mongoose';

export interface IPlan extends Document {
  userId: Types.ObjectId;
  categoryId: Types.ObjectId;
  month: string; // YYYY-MM
  targetAmount: number;
  createdAt: Date;
}

const planSchema = new Schema<IPlan>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
  month: {
    type: String,
    required: true,
    match: [/^\d{4}-(0[1-9]|1[0-2])$/, 'month must be in YYYY-MM format'],
  },
  targetAmount: { type: Number, required: true, min: 0 },
}, { timestamps: true });

planSchema.index({ userId: 1, categoryId: 1, month: 1 }, { unique: true });

export const Plan = model<IPlan>('Plan', planSchema);