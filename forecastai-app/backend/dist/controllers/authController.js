"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
const auth_1 = require("../middleware/auth");
const database_1 = require("../database");
const errorHandler_1 = require("../middleware/errorHandler");
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
async function register(req, res, next) {
    try {
        const { email, name } = req.body;
        if (!email)
            throw new errorHandler_1.ValidationError('Email is required');
        const existing = (0, database_1.getUserByEmail)(email);
        if (existing) {
            const token = (0, auth_1.generateToken)(existing.id, existing.email);
            res.json({ success: true, token, user: { id: existing.id, email: existing.email, name: existing.name } });
            return;
        }
        const user = (0, database_1.createUser)(email, name);
        const token = (0, auth_1.generateToken)(user.id, user.email);
        res.status(201).json({ success: true, token, user });
    }
    catch (err) {
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
async function login(req, res, next) {
    try {
        const { email } = req.body;
        if (!email)
            throw new errorHandler_1.ValidationError('Email is required');
        const user = (0, database_1.getUserByEmail)(email);
        if (!user)
            throw new errorHandler_1.AuthError('User not found. Please register first.');
        const token = (0, auth_1.generateToken)(user.id, user.email);
        res.json({ success: true, token, user: { id: user.id, email: user.email, name: user.name } });
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=authController.js.map