import { Request, Response } from 'express';
import db from '../database';
import logger from '../utils/logger';

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
export async function getHealth(_req: Request, res: Response) {
  const health: any = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    services: { api: { status: 'up' } },
  };

  try {
    db.prepare('SELECT 1').get();
    health.services.database = { status: 'up' };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    logger.error('Health check: database down', { error: errMsg });
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
export async function getReadiness(_req: Request, res: Response) {
  const ready: any = { ready: true, checks: { database: false } };

  try {
    db.prepare('SELECT 1').get();
    ready.checks.database = true;
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    logger.error('Readiness check: database down', { error: errMsg });
    ready.ready = false;
  }

  res.status(ready.ready ? 200 : 503).json(ready);
}
