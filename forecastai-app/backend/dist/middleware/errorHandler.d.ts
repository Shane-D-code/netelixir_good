import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
export { AppError } from '../utils/errors';
export { ValidationError, AuthError, NotFoundError, CsvError, ForecastError, DatabaseError, ErrorCodes } from '../utils/errors';
export declare function errorHandler(err: Error | AppError, req: Request, res: Response, _next: NextFunction): void;
export declare function notFoundHandler(req: Request, res: Response): void;
//# sourceMappingURL=errorHandler.d.ts.map