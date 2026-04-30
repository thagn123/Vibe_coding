import type { NextFunction, Request, Response } from 'express';
import type { ZodType } from 'zod';
import { AppError } from '../utils/app-error';

export const validateBody =
  <T>(schema: ZodType<T>) =>
  (req: Request, _res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return next(
        new AppError('Request body validation failed.', 400, 'VALIDATION_ERROR', parsed.error.flatten()),
      );
    }

    req.body = parsed.data;
    return next();
  };

export const validateQuery =
  <T>(schema: ZodType<T>) =>
  (req: Request, _res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.query);
    if (!parsed.success) {
      return next(
        new AppError('Request query validation failed.', 400, 'VALIDATION_ERROR', parsed.error.flatten()),
      );
    }

    req.query = parsed.data as Request['query'];
    return next();
  };
