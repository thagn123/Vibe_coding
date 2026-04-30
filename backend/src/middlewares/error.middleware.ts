import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/app-error';

export const errorMiddleware = (error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      error: {
        code: error.code,
        statusCode: error.statusCode,
        details: error.details,
      },
    });
  }

  if (error instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: 'Validation error.',
      error: {
        code: 'VALIDATION_ERROR',
        statusCode: 400,
        details: error.flatten(),
      },
    });
  }

  return res.status(500).json({
    success: false,
    message: 'Unexpected server error.',
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      statusCode: 500,
      details: error instanceof Error ? error.message : error,
    },
  });
};
