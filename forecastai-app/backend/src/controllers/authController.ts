import { Request, Response, NextFunction } from 'express';
import { generateToken } from '../middleware/auth';
import { createUser, getUserByEmail } from '../database';
import { ValidationError, AuthError } from '../middleware/errorHandler';

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created
 */
export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, name } = req.body;
    if (!email) throw new ValidationError('Email is required');

    const existing = getUserByEmail(email);
    if (existing) {
      const token = generateToken(existing.id, existing.email);
      res.json({ success: true, token, user: { id: existing.id, email: existing.email, name: existing.name } });
      return;
    }

    const user = createUser(email, name);
    const token = generateToken(user.id, user.email);
    res.status(201).json({ success: true, token, user });
  } catch (err) {
    next(err);
  }
}

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 */
export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email } = req.body;
    if (!email) throw new ValidationError('Email is required');

    const user = getUserByEmail(email);
    if (!user) throw new AuthError('User not found. Please register first.');

    const token = generateToken(user.id, user.email);
    res.json({ success: true, token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    next(err);
  }
}
