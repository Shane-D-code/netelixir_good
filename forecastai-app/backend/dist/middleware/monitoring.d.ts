import { Request, Response, NextFunction } from 'express';
export declare function setupMetrics(app: any): void;
export declare function monitoringMiddleware(req: Request, res: Response, next: NextFunction): void;
export declare function trackError(method: string, route: string, statusCode: number, errorCode: string): void;
//# sourceMappingURL=monitoring.d.ts.map