import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { generateToken } from '../middleware/auth.middleware';
import { createUser, getUserByEmail } from '../../../core/database';
import { ValidationError, AuthError } from '../../../shared/middleware/error-handler';

const SALT_ROUNDS = 10;

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
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created
 */
export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password, name } = req.body;
    if (!email) throw new ValidationError('Email is required');
    if (!password || typeof password !== 'string' || password.length < 8) {
      throw new ValidationError('Password must be at least 8 characters');
    }

    const existing = getUserByEmail(email);
    if (existing) {
      throw new AuthError('Email already registered. Please login.');
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const user = createUser(email, name, hashedPassword);
    const token = generateToken(user.id, user.email);
    res.status(201).json({ success: true, token, user: { id: user.id, email: user.email, name: user.name } });
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
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 */
export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;
    if (!email) throw new ValidationError('Email is required');
    if (!password) throw new ValidationError('Password is required');

    const user = getUserByEmail(email);
    if (!user) throw new AuthError('Invalid credentials');

    if (!user.password) {
      throw new AuthError('Invalid credentials');
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      throw new AuthError('Invalid credentials');
    }

    const token = generateToken(user.id, user.email);
    res.json({ success: true, token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    next(err);
  }
}
