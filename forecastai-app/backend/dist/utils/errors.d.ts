export declare const ErrorCodes: {
    readonly VALIDATION_ERROR: "ERR_VALIDATION";
    readonly AUTH_ERROR: "ERR_AUTH";
    readonly NOT_FOUND: "ERR_NOT_FOUND";
    readonly RATE_LIMIT: "ERR_RATE_LIMIT";
    readonly INTERNAL_ERROR: "ERR_INTERNAL";
    readonly CSV_ERROR: "ERR_CSV";
    readonly FORECAST_ERROR: "ERR_FORECAST";
    readonly DATABASE_ERROR: "ERR_DB";
};
type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];
export declare class AppError extends Error {
    statusCode: number;
    code: ErrorCode;
    details?: unknown;
    timestamp: string;
    constructor(message: string, statusCode?: number, code?: ErrorCode, details?: unknown);
}
export declare class ValidationError extends AppError {
    constructor(message: string, details?: unknown);
}
export declare class AuthError extends AppError {
    constructor(message: string, details?: unknown);
}
export declare class NotFoundError extends AppError {
    constructor(message: string, details?: unknown);
}
export declare class CsvError extends AppError {
    constructor(message: string, details?: unknown);
}
export declare class ForecastError extends AppError {
    constructor(message: string, statusCode?: number, details?: unknown);
}
export declare class DatabaseError extends AppError {
    constructor(message: string, details?: unknown);
}
export {};
//# sourceMappingURL=errors.d.ts.map