export const ErrorCodes = {
  VALIDATION_ERROR: 'ERR_VALIDATION',
  AUTH_ERROR: 'ERR_AUTH',
  NOT_FOUND: 'ERR_NOT_FOUND',
  RATE_LIMIT: 'ERR_RATE_LIMIT',
  INTERNAL_ERROR: 'ERR_INTERNAL',
  CSV_ERROR: 'ERR_CSV',
  FORECAST_ERROR: 'ERR_FORECAST',
  DATABASE_ERROR: 'ERR_DB',
} as const;

type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

export class AppError extends Error {
  public statusCode: number;
  public code: ErrorCode;
  public details?: unknown;
  public timestamp: string;

  constructor(message: string, statusCode: number = 500, code?: ErrorCode, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.code = code || ErrorCodes.INTERNAL_ERROR;
    this.details = details;
    this.timestamp = new Date().toISOString();
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 400, ErrorCodes.VALIDATION_ERROR, details);
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class AuthError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 401, ErrorCodes.AUTH_ERROR, details);
    Object.setPrototypeOf(this, AuthError.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 404, ErrorCodes.NOT_FOUND, details);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class CsvError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 400, ErrorCodes.CSV_ERROR, details);
    Object.setPrototypeOf(this, CsvError.prototype);
  }
}

export class ForecastError extends AppError {
  constructor(message: string, statusCode: number = 500, details?: unknown) {
    super(message, statusCode, ErrorCodes.FORECAST_ERROR, details);
    Object.setPrototypeOf(this, ForecastError.prototype);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 500, ErrorCodes.DATABASE_ERROR, details);
    Object.setPrototypeOf(this, DatabaseError.prototype);
  }
}
