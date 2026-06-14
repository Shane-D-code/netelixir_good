"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseError = exports.ForecastError = exports.CsvError = exports.NotFoundError = exports.AuthError = exports.ValidationError = exports.AppError = exports.ErrorCodes = void 0;
exports.ErrorCodes = {
    VALIDATION_ERROR: 'ERR_VALIDATION',
    AUTH_ERROR: 'ERR_AUTH',
    NOT_FOUND: 'ERR_NOT_FOUND',
    RATE_LIMIT: 'ERR_RATE_LIMIT',
    INTERNAL_ERROR: 'ERR_INTERNAL',
    CSV_ERROR: 'ERR_CSV',
    FORECAST_ERROR: 'ERR_FORECAST',
    DATABASE_ERROR: 'ERR_DB',
};
class AppError extends Error {
    constructor(message, statusCode = 500, code, details) {
        super(message);
        this.statusCode = statusCode;
        this.code = code || exports.ErrorCodes.INTERNAL_ERROR;
        this.details = details;
        this.timestamp = new Date().toISOString();
        Object.setPrototypeOf(this, AppError.prototype);
    }
}
exports.AppError = AppError;
class ValidationError extends AppError {
    constructor(message, details) {
        super(message, 400, exports.ErrorCodes.VALIDATION_ERROR, details);
        Object.setPrototypeOf(this, ValidationError.prototype);
    }
}
exports.ValidationError = ValidationError;
class AuthError extends AppError {
    constructor(message, details) {
        super(message, 401, exports.ErrorCodes.AUTH_ERROR, details);
        Object.setPrototypeOf(this, AuthError.prototype);
    }
}
exports.AuthError = AuthError;
class NotFoundError extends AppError {
    constructor(message, details) {
        super(message, 404, exports.ErrorCodes.NOT_FOUND, details);
        Object.setPrototypeOf(this, NotFoundError.prototype);
    }
}
exports.NotFoundError = NotFoundError;
class CsvError extends AppError {
    constructor(message, details) {
        super(message, 400, exports.ErrorCodes.CSV_ERROR, details);
        Object.setPrototypeOf(this, CsvError.prototype);
    }
}
exports.CsvError = CsvError;
class ForecastError extends AppError {
    constructor(message, statusCode = 500, details) {
        super(message, statusCode, exports.ErrorCodes.FORECAST_ERROR, details);
        Object.setPrototypeOf(this, ForecastError.prototype);
    }
}
exports.ForecastError = ForecastError;
class DatabaseError extends AppError {
    constructor(message, details) {
        super(message, 500, exports.ErrorCodes.DATABASE_ERROR, details);
        Object.setPrototypeOf(this, DatabaseError.prototype);
    }
}
exports.DatabaseError = DatabaseError;
//# sourceMappingURL=errors.js.map