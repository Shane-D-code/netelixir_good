"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateToken = generateToken;
exports.verifyToken = verifyToken;
exports.authenticate = authenticate;
exports.optionalAuth = optionalAuth;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const errorHandler_1 = require("./errorHandler");
const JWT_SECRET = process.env.JWT_SECRET || 'forecastai-dev-secret-change-in-production';
function generateToken(userId, email) {
    return jsonwebtoken_1.default.sign({ id: userId, email }, JWT_SECRET, { expiresIn: '7d' });
}
function verifyToken(token) {
    try {
        return jsonwebtoken_1.default.verify(token, JWT_SECRET);
    }
    catch (err) {
        return null;
    }
}
function authenticate(req, _res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new errorHandler_1.AuthError('No token provided');
    }
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded) {
        throw new errorHandler_1.AuthError('Invalid or expired token');
    }
    req.user = { id: decoded.id, email: decoded.email };
    next();
}
function optionalAuth(req, _res, next) {
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
//# sourceMappingURL=auth.js.map