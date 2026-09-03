import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password: string; 
  role: string;
  is_active: boolean;
  createdAt: Date;
}

const userSchema = new Schema<IUser>({
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, default: 'user' },
    is_active: { type: Boolean, default: true },
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

export const User = model<IUser>('User', userSchema);