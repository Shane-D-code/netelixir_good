import { Request, Response, NextFunction } from 'express';
import { AppError, ErrorCodes } from '../utils/errors';
import { info, warn, error as logError } from '../../core/logging/logger';

export { AppError } from '../utils/errors';
export { ValidationError, AuthError, NotFoundError, CsvError, ForecastError, DatabaseError, ErrorCodes } from '../utils/errors';

export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const requestId = req.requestId;

  if (err instanceof AppError) {
    warn(`Operational error: ${err.message}`, {
      statusCode: err.statusCode,
      code: err.code,
      details: err.details,
      stack: err.stack,
    });

    res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
      status: 'error',
      requestId,
      timestamp: err.timestamp,
      details: err.details || undefined,
    });
    return;
  }

  logError(`Unexpected error: ${err.message}`, {
    stack: err.stack,
  });

  res.status(500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
    code: ErrorCodes.INTERNAL_ERROR,
    status: 'error',
    requestId,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV !== 'production' ? { stack: err.stack } : {}),
  });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: `Route not found: ${req.method} ${req.path}`,
    code: ErrorCodes.NOT_FOUND,
    status: 'error',
    requestId: req.requestId,
    timestamp: new Date().toISOString(),
  });
}
