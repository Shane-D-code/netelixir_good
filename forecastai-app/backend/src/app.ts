import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import multer from 'multer';
import { createServer } from 'http';
import { apiLimiter, forecastLimiter } from './shared/middleware/rate-limiter';
import { errorHandler, notFoundHandler } from './shared/middleware/error-handler';
import { validateForecastRequest, validateBudgetSimulation, validateCSVUpload } from './shared/middleware/validation';
import { generateForecast, getForecastStatus, exportForecastCSV, compareForecast, exportForecastMulti } from './features/forecasting/controllers/forecast.controller';
import { simulateBudget, optimizeBudget, getElasticityCurve } from './features/budget/controllers/budget.controller';
import { getMetrics, getAnomalies, getCausalAnalysis, getCampaignAnalysis, getSeasonality, getROASOptimization, getDataValidation, getOperationalInsights, explainAnomaly, getRiskAnalysis, getBudgetAdvice, getCausalSummary, getForecastExplanation } from './features/analytics/controllers/analytics.controller';
import { uploadCSV } from './features/upload/controllers/upload.controller';
import { register, login } from './features/auth/controllers/auth.controller';
import { getHealth, getReadiness } from './core/monitoring/health.controller';
import { getHolidays, getUpcomingHolidays, checkHoliday } from './features/forecasting/controllers/holiday.controller';
import featureRoutes from './routes/featureRoutes';
import { initWebSocket } from './features/forecasting/websocket/forecast.ws';
import { setupSwagger } from './core/config/swagger';
import { monitoringMiddleware, setupMetrics, trackError } from './core/monitoring/metrics';
import { requestIdMiddleware } from './shared/middleware/request-id';
import { authenticate } from './features/auth/middleware/auth.middleware';
import logger, { requestContext } from './core/logging/logger';
import { ErrorCodes } from './shared/utils/errors';

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';

process.on('uncaughtException', (err) => {
  logger.error(`Uncaught exception: ${err.message}`, { stack: err.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  const msg = reason instanceof Error ? reason.message : String(reason);
  const stack = reason instanceof Error ? reason.stack : undefined;
  logger.error(`Unhandled rejection: ${msg}`, { stack });
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.originalname.endsWith('.csv')) {
      cb(new Error('Only CSV files are accepted'));
      return;
    }
    cb(null, true);
  },
});

app.use(helmet());
app.use(compression());
app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(apiLimiter);
app.use(requestIdMiddleware);
app.use(monitoringMiddleware);

app.use((req, _res, next) => {
  requestContext.run({ requestId: req.requestId, path: req.path, method: req.method }, () => {
    logger.info(`${req.method} ${req.path}`);
    next();
  });
});

// === PUBLIC ROUTES ===
// Health
app.get('/api/health', getHealth);
app.get('/api/health/readiness', getReadiness);

// Auth
const jsonParser = express.json();
app.post('/api/auth/register', jsonParser, register);
app.post('/api/auth/login', jsonParser, login);

// === PROTECTED ROUTES ===
// Upload
app.post('/api/upload/csv', authenticate, upload.single('file'), validateCSVUpload, uploadCSV);

// Forecast
app.post('/api/forecast/generate', authenticate, upload.single('file'), forecastLimiter, validateForecastRequest, generateForecast);
app.get('/api/forecast/status/:id', authenticate, getForecastStatus);
app.get('/api/forecast/export/:id', authenticate, exportForecastCSV);
app.get('/api/forecast/export/:id/:format', authenticate, exportForecastMulti);
app.post('/api/forecast/compare', authenticate, jsonParser, compareForecast);

// Budget
app.post('/api/budget/simulate', authenticate, jsonParser, forecastLimiter, validateBudgetSimulation, simulateBudget);
app.post('/api/budget/optimize', authenticate, jsonParser, optimizeBudget);
app.get('/api/budget/elasticity/:channel', authenticate, jsonParser, getElasticityCurve);

// Analytics
app.post('/api/analytics/metrics', authenticate, jsonParser, getMetrics);
app.post('/api/analytics/anomalies', authenticate, jsonParser, getAnomalies);
app.post('/api/analytics/causal', authenticate, jsonParser, getCausalAnalysis);
app.post('/api/analytics/campaigns', authenticate, jsonParser, getCampaignAnalysis);
app.post('/api/analytics/seasonality', authenticate, jsonParser, getSeasonality);
app.post('/api/analytics/roas-optimize', authenticate, jsonParser, getROASOptimization);
app.post('/api/analytics/validate', authenticate, jsonParser, getDataValidation);
app.post('/api/analytics/insights', authenticate, jsonParser, getOperationalInsights);

// LLM-powered AI insights
app.post('/api/analytics/explain/anomaly', authenticate, jsonParser, explainAnomaly);
app.post('/api/analytics/explain/forecast', authenticate, jsonParser, getForecastExplanation);
app.post('/api/analytics/risks', authenticate, jsonParser, getRiskAnalysis);
app.post('/api/analytics/budget-advice', authenticate, jsonParser, getBudgetAdvice);
app.post('/api/analytics/causal-summary', authenticate, jsonParser, getCausalSummary);

// Holidays
app.get('/api/holidays', getHolidays);
app.get('/api/holidays/upcoming', getUpcomingHolidays);
app.get('/api/holidays/check/:date', checkHoliday);

// Feature routes (Goal Planner, Promotion Simulator, Stress Test, etc.)
app.use('/api', authenticate, featureRoutes);

const server = createServer(app);

initWebSocket(server);
setupSwagger(app);
setupMetrics(app);

app.use(notFoundHandler);

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  const route = req.route?.path || req.path;
  const statusCode = 'statusCode' in err ? (err as any).statusCode : 500;
  const errorCode = 'code' in err ? (err as any).code : ErrorCodes.INTERNAL_ERROR;
  try { trackError(req.method, route, statusCode, errorCode); } catch { /* metrics failure must not block error response */ }
  errorHandler(err, req, res, next);
});

server.listen(PORT, () => {
  logger.info(`ForecastAI API running on port ${PORT}`);
  logger.info(`CORS origin: ${CORS_ORIGIN}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`WebSocket server ready`);
  logger.info(`Swagger docs at http://localhost:${PORT}/api-docs`);
  logger.info(`Metrics at http://localhost:${PORT}/api/metrics`);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => process.exit(0));
});

export default app;
