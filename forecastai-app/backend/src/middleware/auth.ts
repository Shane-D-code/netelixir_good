import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { AuthError } from './errorHandler';

const JWT_SECRET = process.env.JWT_SECRET || 'forecastai-dev-secret-change-in-production';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export function generateToken(userId: string, email: string): string {
  return jwt.sign({ id: userId, email }, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

export function authenticate(req: AuthRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AuthError('No token provided');
  }

  const token = authHeader.substring(7);
  const decoded = verifyToken(token);
  if (!decoded) {
    throw new AuthError('Invalid or expired token');
  }

  req.user = { id: decoded.id, email: decoded.email };
  next();
}

export function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (decoded) {
      req.user = { id: decoded.id, email: decoded.email };
    }
  }
  next();
}
