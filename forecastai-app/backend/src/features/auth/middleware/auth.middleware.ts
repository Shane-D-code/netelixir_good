import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { AuthError } from '../../../shared/middleware/error-handler';

const JWT_SECRET = process.env.JWT_SECRET || '';
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  console.error('WARNING: JWT_SECRET is not set or too short. Set a secure secret in .env');
}

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
    return next(new AuthError('No token provided'));
  }

  const token = authHeader.substring(7);
  const decoded = verifyToken(token);
  if (!decoded) {
    return next(new AuthError('Invalid or expired token'));
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
