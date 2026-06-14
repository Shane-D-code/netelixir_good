"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.forecastLimiter = exports.apiLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
exports.apiLimiter = (0, express_rate_limit_1.default)({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: 'Too many requests, please try again later.',
        status: 'error',
    },
});
exports.forecastLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: 'Too many forecast requests. Please wait before generating another.',
        status: 'error',
    },
});
//# sourceMappingURL=rateLimiter.js.map