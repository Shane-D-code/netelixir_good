import { Request, Response, NextFunction } from 'express';
/**
 * @swagger
 * /forecast/generate:
 *   post:
 *     summary: Generate revenue forecast (async)
 *     tags: [Forecast]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               channel_budgets:
 *                 type: string
 *                 description: JSON string of channel budgets
 *               forecast_days:
 *                 type: number
 *                 default: 60
 *               confidence_level:
 *                 type: number
 *                 default: 0.8
 *               n_simulations:
 *                 type: number
 *                 default: 1000
 *     responses:
 *       202:
 *         description: Forecast generation started
 *       400:
 *         description: Invalid request
 */
export declare function generateForecast(req: Request, res: Response, next: NextFunction): Promise<void>;
/**
 * @swagger
 * /forecast/status/{id}:
 *   get:
 *     summary: Get forecast generation status
 *     tags: [Forecast]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Job status
 *       404:
 *         description: Job not found
 */
export declare function getForecastStatus(req: Request, res: Response, next: NextFunction): Promise<void>;
/**
 * @swagger
 * /forecast/export/{id}:
 *   get:
 *     summary: Export forecast as CSV
 *     tags: [Forecast]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: CSV file
 *       404:
 *         description: Forecast not found
 */
export declare function exportForecastCSV(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function compareForecast(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function exportForecastMulti(req: Request, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=forecastController.d.ts.map