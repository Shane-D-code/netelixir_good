import { Request, Response } from 'express';
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
export declare function getHealth(_req: Request, res: Response): Promise<void>;
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
export declare function getReadiness(_req: Request, res: Response): Promise<void>;
//# sourceMappingURL=healthController.d.ts.map