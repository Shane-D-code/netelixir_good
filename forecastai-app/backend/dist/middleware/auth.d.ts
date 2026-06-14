import { Request, Response, NextFunction } from 'express';
export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
    };
}
export declare function generateToken(userId: string, email: string): string;
export declare function verifyToken(token: string): any;
export declare function authenticate(req: AuthRequest, _res: Response, next: NextFunction): void;
export declare function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction): void;
//# sourceMappingURL=auth.d.ts.map