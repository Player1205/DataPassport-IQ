import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { AppError } from "./errorHandler";
import { User, IUser } from "../models/User";
import { logger } from "../utils/logger";

// Extend Express Request to carry the authed user
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

interface JwtPayload {
  sub: string;          // user._id
  address: string;      // wallet address
  role: string;
  iat: number;
  exp: number;
}

/**
 * requireAuth – protects routes; attaches req.user.
 */
export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      throw new AppError(401, "No token provided.", "UNAUTHORIZED");
    }

    const token = authHeader.slice(7);
    let payload: JwtPayload;
    try {
      payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ["HS256"] }) as JwtPayload;
    } catch {
      throw new AppError(401, "Invalid or expired token.", "TOKEN_INVALID");
    }

    const user = await User.findById(payload.sub);
    if (!user) {
      throw new AppError(401, "User not found.", "UNAUTHORIZED");
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * requireRole – role-based guard; call after requireAuth.
 */
export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(401, "Not authenticated.", "UNAUTHORIZED"));
    }
    if (!roles.includes(req.user.role)) {
      return next(new AppError(403, "Insufficient permissions.", "FORBIDDEN"));
    }
    next();
  };
}

/**
 * optionalAuth – attaches user if token present, never rejects.
 */
export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) return next();

    const token = authHeader.slice(7);
    const payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ["HS256"] }) as JwtPayload;
    const user = await User.findById(payload.sub);
    if (user) req.user = user;
  } catch (err) {
    logger.debug("optionalAuth – token invalid, continuing unauthenticated.", err);
  }
  next();
}
