import { env } from "../config/env";
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { RefreshToken } from "../models/RefreshToken";
import { User } from "../models/User";
import { Types } from "mongoose";

export const generateAccessToken = (user: { id: string; username: string; role: string; is_active: boolean }) => {
    return jwt.sign(
        { id: user.id, username: user.username, role: user.role, is_active: user.is_active },
        env().JWT_SECRET,
        { expiresIn: env().JWT_EXPIRES_IN }
    );
};

export function generateCSRFToken() {
  return crypto.randomBytes(32).toString("hex");
}

export const generateRefreshToken = async (userId: Types.ObjectId) => {
    const token = crypto.randomBytes(64).toString('hex');
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await RefreshToken.findOneAndDelete({ user: userId }).exec();
    await RefreshToken.create({ token, user: userId, expiresAt: expires });

    return token;
}

export const regenerateRefreshToken = async (oldToken: string) => {
    const result = await RefreshToken.findOne({
        token: oldToken,
        expiresAt: { $gt: new Date() },
    }).exec();

    if (!result) return null;

    const userId = result.user;

    //delete old refresh token
    await RefreshToken.deleteOne({ token: oldToken }).exec();

    const user = await User.findById(userId).exec();
    if (!user) return null;

    const accessToken = generateAccessToken({
        id: user._id.toString(),
        username: user.email,
        role: user.role,
        is_active: user.is_active,
    });
    const refreshToken = await generateRefreshToken(userId);

    return { accessToken, refreshToken, user };
}