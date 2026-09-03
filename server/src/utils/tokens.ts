import { env } from "../config/env";
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { RefreshToken } from "../models/RefreshToken";
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

// export const regenerateRefreshToken = async (oldToken: string) => {
//     const result = await RefreshToken.findOne({ token: oldToken }).exec();

//     if (!result) return null;

//     const { user } = result;
//     const accessToken = generateAccessToken(user);



//     const result = await pool.query(
//         `SELECT * FROM refresh_tokens WHERE token = $1 AND expires_at > NOW()`,
//         [oldToken]
//     );

//     if (result.rows.length === 0) return null;

//     const { user_id } = result.rows[0];

//     //delete old refresh token
//     await pool.query(
//         `DELETE FROM refresh_tokens WHERE token = $1`,
//         [oldToken]
//     );

//     const userResult = await pool.query(
//         `SELECT * FROM users WHERE id = $1`,
//         [user_id]
//     );
//     if (userResult.rows.length === 0) return null;

//     const user = userResult.rows[0];
//     const accessToken = generateAccessToken(user);
//     const refreshToken = await generateRefreshToken(user_id);

//     return { accessToken, refreshToken, user };
// }