"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateForecast = generateForecast;
exports.getForecastStatus = getForecastStatus;
exports.exportForecastCSV = exportForecastCSV;
exports.compareForecast = compareForecast;
exports.exportForecastMulti = exportForecastMulti;
const forecastServiceWithTracking_1 = require("../services/forecastServiceWithTracking");
const jobQueue_1 = require("../services/jobQueue");
const database_1 = require("../database");
const errorHandler_1 = require("../middleware/errorHandler");
const forecastComparison_1 = require("../services/forecastComparison");
const exportService_1 = require("../services/exportService");
const logger_1 = __importDefault(require("../utils/logger"));
const parseJSON = (val) => {
    if (typeof val === 'string')
        return JSON.parse(val);
    return val;
};
function parseForecastParams(body) {
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
async function generateForecast(req, res, next) {
    try {
        const file = req.file;
        if (!file)
            throw new errorHandler_1.ValidationError('CSV file is required');
        const params = parseForecastParams(req.body);
        const jobId = jobQueue_1.jobQueue.createJob();
        const csvContent = file.buffer.toString('utf-8');
        (0, database_1.saveForecast)(jobId, params);
        logger_1.default.info(`Forecast job ${jobId} created with params: ${JSON.stringify({ ...params, channel_budgets: params.channel_budgets })}`);
        (0, forecastServiceWithTracking_1.generateForecastWithTracking)(csvContent, params, jobId)
            .then((result) => {
            (0, database_1.saveForecast)(jobId, params, result);
            logger_1.default.info(`Forecast job ${jobId} completed successfully`);
        })
            .catch((err) => {
            (0, database_1.saveForecast)(jobId, params, null, err.message);
            logger_1.default.error(`Forecast job ${jobId} failed`, { error: err.message, stack: err.stack });
        });
        res.status(202).json({
            success: true,
            jobId,
            message: 'Forecast generation started',
        });
    }
    catch (err) {
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
async function getForecastStatus(req, res, next) {
    try {
        const { id } = req.params;
        if (!id)
            throw new errorHandler_1.ValidationError('Forecast ID is required');
        let job = jobQueue_1.jobQueue.getJob(id);
        if (!job) {
            const dbRecord = (0, database_1.getForecast)(id);
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
        if (!job)
            throw new errorHandler_1.NotFoundError(`Forecast job '${id}' not found`);
        res.json({
            success: true,
            status: job.status,
            progress: job.progress,
            error: job.error,
            result: job.status === 'completed' ? job.result : undefined,
        });
    }
    catch (err) {
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
async function exportForecastCSV(req, res, next) {
    try {
        const { id } = req.params;
        if (!id)
            throw new errorHandler_1.ValidationError('Forecast ID is required');
        let result = jobQueue_1.jobQueue.getJob(id)?.result;
        if (!result) {
            const dbRecord = (0, database_1.getForecast)(id);
            if (dbRecord && dbRecord.result)
                result = dbRecord.result;
        }
        if (!result || !result.total_forecast || !result.total_forecast.dates) {
            throw new errorHandler_1.NotFoundError(`Forecast '${id}' not found or not yet completed`);
        }
        const { total_forecast, channel_forecasts } = result;
        const rows = [];
        rows.push('Date,Channel,P10,P25,P50,P75,P90');
        for (const [channel, fc] of Object.entries(channel_forecasts || {})) {
            const ch = fc;
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
    }
    catch (err) {
        next(err);
    }
}
async function compareForecast(req, res, next) {
    try {
        const { actual, forecast } = req.body;
        if (!actual || !forecast) {
            throw new errorHandler_1.ValidationError('Both "actual" and "forecast" arrays are required');
        }
        if (!Array.isArray(actual) || !Array.isArray(forecast)) {
            throw new errorHandler_1.ValidationError('"actual" and "forecast" must be arrays');
        }
        const comparison = new forecastComparison_1.ForecastComparison();
        const result = comparison.compare(actual, forecast);
        res.json({ success: true, ...result });
    }
    catch (err) {
        next(err);
    }
}
async function exportForecastMulti(req, res, next) {
    try {
        const { id, format } = req.params;
        if (!id)
            throw new errorHandler_1.ValidationError('Forecast ID is required');
        if (!format)
            throw new errorHandler_1.ValidationError('Format is required (csv, json)');
        let result = jobQueue_1.jobQueue.getJob(id)?.result;
        if (!result) {
            const dbRecord = (0, database_1.getForecast)(id);
            if (dbRecord && dbRecord.result)
                result = dbRecord.result;
        }
        if (!result || !result.total_forecast || !result.total_forecast.dates) {
            throw new errorHandler_1.NotFoundError(`Forecast '${id}' not found or not yet completed`);
        }
        const exportService = new exportService_1.ExportService();
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
                throw new errorHandler_1.ValidationError('Invalid format. Use: csv or json');
        }
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=forecastController.js.map