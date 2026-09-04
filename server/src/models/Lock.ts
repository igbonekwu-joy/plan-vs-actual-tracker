import { Schema, model, Document, Types } from 'mongoose';

export interface ILock extends Document {
  userId: Types.ObjectId;
  month: string; // YYYY-MM
  createdAt: Date;
}

const lockSchema = new Schema<ILock>({
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        month: {
            type: String,
            required: true,
            match: [/^\d{4}-(0[1-9]|1[0-2])$/, 'month must be in YYYY-MM format'],
        },
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

// a month is either locked or not. one lock document per user+month
lockSchema.index({ userId: 1, month: 1 }, { unique: true });

export const Lock = model<ILock>('Lock', lockSchema);