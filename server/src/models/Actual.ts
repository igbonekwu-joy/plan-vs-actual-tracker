import { Schema, model, Document, Types } from 'mongoose';

export interface IActual extends Document {
  userId: Types.ObjectId;
  categoryId: Types.ObjectId;
  month: string; // YYYY-MM
  amount: number;
  note?: string;
  createdAt: Date;
}

const actualSchema = new Schema<IActual>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    month: {
      type: String,
      required: true,
      match: [/^\d{4}-(0[1-9]|1[0-2])$/, 'month must be in YYYY-MM format'],
    },
    amount: { type: Number, required: true, min: 0 },
    note: { type: String, trim: true },
  }, 
  {
    timestamps: true,
    versionKey: false, 
    toJSON: {
      transform(_doc: unknown, rec: Record<string, unknown>) {
        rec.id = rec._id; 
        delete rec._id; 
        return rec; 
      }
    }
  }
);

actualSchema.index({ userId: 1, categoryId: 1, month: 1 });

export const Actual = model<IActual>('Actual', actualSchema);