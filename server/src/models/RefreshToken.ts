import { Document, model, Schema, Types } from "mongoose";

export interface IRefreshToken extends Document {
  token: string;
  user: Types.ObjectId;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const refreshTokenSchema = new Schema<IRefreshToken>(
  {
    token: { type: String, required: true, unique: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true, collection: 'refresh_tokens' }
);

export const RefreshToken = model<IRefreshToken>('RefreshToken', refreshTokenSchema);