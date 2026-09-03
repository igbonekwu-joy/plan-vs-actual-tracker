import type { Request, Response, NextFunction } from "express";
import { generateCSRFToken } from "../utils/tokens";
import { env } from "../config/env";

export const attachCSRF = (req: Request, res: Response, next: NextFunction) => {
    const csrfToken = req.cookies?.csrf_token || generateCSRFToken();

    res.cookie('csrf_token', csrfToken, {
        httpOnly: true,       
        secure: env().NODE_ENV === 'production',
        sameSite: env().NODE_ENV === 'production' ? 'none' : 'strict',
    });

    res.setHeader('X-CSRF-Token', csrfToken);

  next();
}

export const csrf = (req: Request, res: Response, next: NextFunction) => {
    const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

    // skip for safe methods
    if (SAFE_METHODS.includes(req.method)) return next();

    // skip for CLI — they use Bearer token not cookies
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) return next();

    const tokenFromCookie = req.cookies?.csrf_token;
    const tokenFromHeader = req.headers["x-csrf-token"];

    if (!tokenFromCookie || !tokenFromHeader) {
        return res.status(403).json({
            status: "error",
            message: "Missing CSRF token"
        });
    }

    if (tokenFromCookie !== tokenFromHeader) {
        return res.status(403).json({
            status: "error",
            message: "Invalid CSRF token"
        });
    }

    next();
}

module.exports = { attachCSRF, csrf };