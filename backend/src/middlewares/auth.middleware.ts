import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from '../utils/app-error';

const JWT_SECRET = env.JWT_SECRET;

interface JWTPayload {
  uid: string;
  email: string;
}

const extractBearerToken = (req: Request) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice(7);
};

export const requireAuth = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const token = extractBearerToken(req);
    if (!token) {
      return next(new AppError('Authentication token is required.', 401, 'UNAUTHORIZED'));
    }

    // Verify Custom JWT
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
      req.user = {
        uid: decoded.uid,
        email: decoded.email,
        token: decoded as any,
      };
      return next();
    } catch (jwtErr) {
      // If JWT verification fails, it might be an old dev token or invalid
      return next(new AppError('Invalid or expired authentication token.', 401, 'INVALID_TOKEN', jwtErr));
    }
  } catch (error) {
    return next(new AppError('Authentication failed.', 401, 'AUTH_FAILED', error));
  }
};

export const optionalAuth = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const token = extractBearerToken(req);
    if (!token) {
      return next();
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
      req.user = {
        uid: decoded.uid,
        email: decoded.email,
        token: decoded as any,
      };
    } catch {
      // Silently proceed as guest if token is invalid
    }
    return next();
  } catch (error) {
    return next();
  }
};
