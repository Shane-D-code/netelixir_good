"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHealth = getHealth;
exports.getReadiness = getReadiness;
const database_1 = __importDefault(require("../database"));
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service health status
 */
async function getHealth(_req, res) {
    const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
        services: { api: { status: 'up' } },
    };
    try {
        database_1.default.prepare('SELECT 1').get();
        health.services.database = { status: 'up' };
    }
    catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        logger_1.default.error('Health check: database down', { error: errMsg });
        health.services.database = { status: 'down', error: errMsg };
        health.status = 'degraded';
    }
    res.json(health);
}
/**
 * @swagger
 * /health/readiness:
 *   get:
 *     summary: Readiness check
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is ready
 *       503:
 *         description: Service not ready
 */
async function getReadiness(_req, res) {
    const ready = { ready: true, checks: { database: false } };
    try {
        database_1.default.prepare('SELECT 1').get();
        ready.checks.database = true;
    }
    catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        logger_1.default.error('Readiness check: database down', { error: errMsg });
        ready.ready = false;
    }
    res.status(ready.ready ? 200 : 503).json(ready);
}
//# sourceMappingURL=healthController.js.map