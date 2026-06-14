"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorCodes = exports.DatabaseError = exports.ForecastError = exports.CsvError = exports.NotFoundError = exports.AuthError = exports.ValidationError = exports.AppError = void 0;
exports.errorHandler = errorHandler;
exports.notFoundHandler = notFoundHandler;
const errors_1 = require("../utils/errors");
const logger_1 = require("../utils/logger");
var errors_2 = require("../utils/errors");
Object.defineProperty(exports, "AppError", { enumerable: true, get: function () { return errors_2.AppError; } });
var errors_3 = require("../utils/errors");
Object.defineProperty(exports, "ValidationError", { enumerable: true, get: function () { return errors_3.ValidationError; } });
Object.defineProperty(exports, "AuthError", { enumerable: true, get: function () { return errors_3.AuthError; } });
Object.defineProperty(exports, "NotFoundError", { enumerable: true, get: function () { return errors_3.NotFoundError; } });
Object.defineProperty(exports, "CsvError", { enumerable: true, get: function () { return errors_3.CsvError; } });
Object.defineProperty(exports, "ForecastError", { enumerable: true, get: function () { return errors_3.ForecastError; } });
Object.defineProperty(exports, "DatabaseError", { enumerable: true, get: function () { return errors_3.DatabaseError; } });
Object.defineProperty(exports, "ErrorCodes", { enumerable: true, get: function () { return errors_3.ErrorCodes; } });
function errorHandler(err, req, res, _next) {
    const requestId = req.requestId;
    if (err instanceof errors_1.AppError) {
        (0, logger_1.warn)(`Operational error: ${err.message}`, {
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
    (0, logger_1.error)(`Unexpected error: ${err.message}`, {
        stack: err.stack,
    });
    res.status(500).json({
        error: process.env.NODE_ENV === 'production'
            ? 'Internal server error'
            : err.message,
        code: errors_1.ErrorCodes.INTERNAL_ERROR,
        status: 'error',
        requestId,
        timestamp: new Date().toISOString(),
        ...(process.env.NODE_ENV !== 'production' ? { stack: err.stack } : {}),
    });
}
function notFoundHandler(req, res) {
    res.status(404).json({
        error: `Route not found: ${req.method} ${req.path}`,
        code: errors_1.ErrorCodes.NOT_FOUND,
        status: 'error',
        requestId: req.requestId,
        timestamp: new Date().toISOString(),
    });
}
//# sourceMappingURL=errorHandler.js.map