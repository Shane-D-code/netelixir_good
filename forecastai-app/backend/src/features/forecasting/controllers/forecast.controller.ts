import { Request, Response, NextFunction } from 'express';
import { forecastService } from '../services/forecast.service';
import { generateForecastWithTracking } from '../services/forecast-tracking.service';
import { jobQueue } from '../services/job-queue.service';
import { saveForecast, getForecast } from '../../../core/database';
import { ValidationError, NotFoundError } from '../../../shared/middleware/error-handler';
import { ForecastComparison } from '../services/forecast-comparison.service';
import { ExportService } from '../../reports/services/export.service';
import { llmService } from '../../llm/services/llm.service';
import logger from '../../../core/logging/logger';

const parseJSON = (val: any) => {
  if (typeof val === 'string') return JSON.parse(val);
  return val;
};

function parseForecastParams(body: any) {
  return {
    channel_budgets: parseJSON(body.channel_budgets) || { 'Google Ads': 10000, 'Meta Ads': 8000, 'Microsoft Ads': 5000 },
    forecast_days: parseInt(body.forecast_days || '60', 10),
    confidence_level: parseFloat(body.confidence_level || '0.8'),
    n_simulations: parseInt(body.n_simulations || '1000', 10),
    enable_enhanced: body.enable_enhanced === 'true',
    enable_ai_insights: body.enable_ai_insights !== 'false',
    enable_caching: body.enable_caching !== 'false',
    enable_anomaly_detection: body.enable_anomaly_detection !== 'false',
    enable_causal_inference: body.enable_causal_inference !== 'false',
    enable_campaign_decomposition: body.enable_campaign_decomposition !== 'false',
    enable_risk_metrics: body.enable_risk_metrics !== 'false',
  };
}

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
export async function generateForecast(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const file = req.file;
    if (!file) throw new ValidationError('CSV file is required');

    const params = parseForecastParams(req.body);
    const jobId = jobQueue.createJob();
    const csvContent = file.buffer.toString('utf-8');

    saveForecast(jobId, params);
    logger.info(`Forecast job ${jobId} created with params: ${JSON.stringify({ ...params, channel_budgets: params.channel_budgets })}`);

    generateForecastWithTracking(csvContent, params, jobId)
      .then(async (result) => {
        if (params.enable_ai_insights !== false) {
          try {
            const insights = await llmService.generateForecastInsights(
              result,
              result.anomalies || [],
              result.causal_drivers || [],
              { budgets: params.channel_budgets }
            );
            result.ai_insights = insights;
          } catch (err: any) {
            logger.warn(`AI insights not available for job ${jobId}`, { error: err.message });
          }
        }
        saveForecast(jobId, params, result);
        logger.info(`Forecast job ${jobId} completed successfully`);
      })
      .catch((err) => {
        saveForecast(jobId, params, null, err.message);
        logger.error(`Forecast job ${jobId} failed`, { error: err.message, stack: err.stack });
      });

    res.status(202).json({
      success: true,
      jobId,
      message: 'Forecast generation started',
    });
  } catch (err) {
    next(err);
  }
}

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
export async function getForecastStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    if (!id) throw new ValidationError('Forecast ID is required');

    let job = jobQueue.getJob(id);
    if (!job) {
      const dbRecord = getForecast(id);
      if (dbRecord) {
        job = {
          id: dbRecord.id,
          status: dbRecord.status,
          progress: dbRecord.status === 'completed' ? 100 : dbRecord.status === 'failed' ? 100 : 0,
          result: dbRecord.result,
          error: dbRecord.error,
          createdAt: new Date(dbRecord.created_at),
          updatedAt: new Date(),
        };
      }
    }

    if (!job) throw new NotFoundError(`Forecast job '${id}' not found`);

    res.json({
      success: true,
      status: job.status,
      progress: job.progress,
      error: job.error,
      result: job.status === 'completed' ? job.result : undefined,
    });
  } catch (err) {
    next(err);
  }
}

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
export async function exportForecastCSV(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    if (!id) throw new ValidationError('Forecast ID is required');

    let result = jobQueue.getJob(id)?.result;
    if (!result) {
      const dbRecord = getForecast(id);
      if (dbRecord && dbRecord.result) result = dbRecord.result;
    }

    if (!result || !result.total_forecast || !result.total_forecast.dates) {
      throw new NotFoundError(`Forecast '${id}' not found or not yet completed`);
    }

    const { total_forecast, channel_forecasts } = result;
    const rows: string[] = [];
    rows.push('Date,Channel,P10,P25,P50,P75,P90');

    for (const [channel, fc] of Object.entries(channel_forecasts || {})) {
      const ch = fc as any;
      for (let i = 0; i < (ch.dates?.length || 0); i++) {
        rows.push([
          ch.dates[i],
          channel,
          ch.p10?.[i] ?? '',
          ch.p25?.[i] ?? '',
          ch.median?.[i] ?? '',
          ch.p75?.[i] ?? '',
          ch.p90?.[i] ?? '',
        ].join(','));
      }
    }

    if (total_forecast?.dates) {
      rows.push('');
      rows.push('Aggregate,P10,P25,P50,P75,P90');
      for (let i = 0; i < total_forecast.dates.length; i++) {
        rows.push([
          total_forecast.dates[i],
          'Total',
          total_forecast.p10?.[i] ?? '',
          total_forecast.p25?.[i] ?? '',
          total_forecast.median?.[i] ?? '',
          total_forecast.p75?.[i] ?? '',
          total_forecast.p90?.[i] ?? '',
        ].join(','));
      }
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=forecast_${id}.csv`);
    res.send(rows.join('\n'));
  } catch (err) {
    next(err);
  }
}

export async function compareForecast(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { actual, forecast } = req.body;
    if (!actual || !forecast) {
      throw new ValidationError('Both "actual" and "forecast" arrays are required');
    }
    if (!Array.isArray(actual) || !Array.isArray(forecast)) {
      throw new ValidationError('"actual" and "forecast" must be arrays');
    }

    const comparison = new ForecastComparison();
    const result = comparison.compare(actual, forecast);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

export async function exportForecastMulti(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id, format } = req.params;
    if (!id) throw new ValidationError('Forecast ID is required');
    if (!format) throw new ValidationError('Format is required (csv, json)');

    let result = jobQueue.getJob(id)?.result;
    if (!result) {
      const dbRecord = getForecast(id);
      if (dbRecord && dbRecord.result) result = dbRecord.result;
    }

    if (!result || !result.total_forecast || !result.total_forecast.dates) {
      throw new NotFoundError(`Forecast '${id}' not found or not yet completed`);
    }

    const exportService = new ExportService();

    switch (format) {
      case 'csv':
        const csvData = exportService.toCSV(result, id);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=forecast_${id}.csv`);
        res.send(csvData);
        break;

      case 'json':
        const jsonData = exportService.toJSON(result);
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=forecast_${id}.json`);
        res.send(jsonData);
        break;

      default:
        throw new ValidationError('Invalid format. Use: csv or json');
    }
  } catch (err) {
    next(err);
  }
}
