"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const multer_1 = __importDefault(require("multer"));
const http_1 = require("http");
const rateLimiter_1 = require("./middleware/rateLimiter");
const errorHandler_1 = require("./middleware/errorHandler");
const auth_1 = require("./middleware/auth");
const validation_1 = require("./middleware/validation");
const forecastController_1 = require("./controllers/forecastController");
const budgetController_1 = require("./controllers/budgetController");
const analyticsController_1 = require("./controllers/analyticsController");
const uploadController_1 = require("./controllers/uploadController");
const authController_1 = require("./controllers/authController");
const healthController_1 = require("./controllers/healthController");
const holidayController_1 = require("./controllers/holidayController");
const websocket_1 = require("./websocket");
const swagger_1 = require("./swagger");
const monitoring_1 = require("./middleware/monitoring");
const requestId_1 = require("./middleware/requestId");
const logger_1 = __importStar(require("./utils/logger"));
const errors_1 = require("./utils/errors");
const app = (0, express_1.default)();
const PORT = parseInt(process.env.PORT || '3001', 10);
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';
process.on('uncaughtException', (err) => {
    logger_1.default.error(`Uncaught exception: ${err.message}`, { stack: err.stack });
    process.exit(1);
});
process.on('unhandledRejection', (reason) => {
    const msg = reason instanceof Error ? reason.message : String(reason);
    const stack = reason instanceof Error ? reason.stack : undefined;
    logger_1.default.error(`Unhandled rejection: ${msg}`, { stack });
});
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        if (!file.originalname.endsWith('.csv')) {
            cb(new Error('Only CSV files are accepted'));
            return;
        }
        cb(null, true);
    },
});
app.use((0, helmet_1.default)());
app.use((0, compression_1.default)());
app.use((0, cors_1.default)({ origin: CORS_ORIGIN, credentials: true }));
app.use(rateLimiter_1.apiLimiter);
app.use(requestId_1.requestIdMiddleware);
app.use(monitoring_1.monitoringMiddleware);
app.use((req, _res, next) => {
    logger_1.requestContext.run({ requestId: req.requestId, path: req.path, method: req.method }, () => {
        logger_1.default.info(`${req.method} ${req.path}`);
        next();
    });
});
// === PUBLIC ROUTES ===
// Health
app.get('/api/health', healthController_1.getHealth);
app.get('/api/health/readiness', healthController_1.getReadiness);
// Auth
const jsonParser = express_1.default.json();
app.post('/api/auth/register', jsonParser, authController_1.register);
app.post('/api/auth/login', jsonParser, authController_1.login);
// === PROTECTED ROUTES ===
// Upload
app.post('/api/upload/csv', auth_1.authenticate, upload.single('file'), validation_1.validateCSVUpload, uploadController_1.uploadCSV);
// Forecast
app.post('/api/forecast/generate', auth_1.authenticate, upload.single('file'), rateLimiter_1.forecastLimiter, validation_1.validateForecastRequest, forecastController_1.generateForecast);
app.get('/api/forecast/status/:id', auth_1.authenticate, forecastController_1.getForecastStatus);
app.get('/api/forecast/export/:id', auth_1.authenticate, forecastController_1.exportForecastCSV);
app.get('/api/forecast/export/:id/:format', auth_1.authenticate, forecastController_1.exportForecastMulti);
app.post('/api/forecast/compare', auth_1.authenticate, jsonParser, forecastController_1.compareForecast);
// Budget
app.post('/api/budget/simulate', auth_1.authenticate, jsonParser, rateLimiter_1.forecastLimiter, validation_1.validateBudgetSimulation, budgetController_1.simulateBudget);
app.post('/api/budget/optimize', auth_1.authenticate, jsonParser, budgetController_1.optimizeBudget);
app.get('/api/budget/elasticity/:channel', auth_1.authenticate, jsonParser, budgetController_1.getElasticityCurve);
// Analytics
app.post('/api/analytics/metrics', auth_1.authenticate, jsonParser, analyticsController_1.getMetrics);
app.post('/api/analytics/anomalies', auth_1.authenticate, jsonParser, analyticsController_1.getAnomalies);
app.post('/api/analytics/causal', auth_1.authenticate, jsonParser, analyticsController_1.getCausalAnalysis);
app.post('/api/analytics/campaigns', auth_1.authenticate, jsonParser, analyticsController_1.getCampaignAnalysis);
app.post('/api/analytics/seasonality', auth_1.authenticate, jsonParser, analyticsController_1.getSeasonality);
app.post('/api/analytics/roas-optimize', auth_1.authenticate, jsonParser, analyticsController_1.getROASOptimization);
app.post('/api/analytics/validate', auth_1.authenticate, jsonParser, analyticsController_1.getDataValidation);
app.post('/api/analytics/insights', auth_1.authenticate, jsonParser, analyticsController_1.getOperationalInsights);
// Holidays
app.get('/api/holidays', auth_1.authenticate, holidayController_1.getHolidays);
app.get('/api/holidays/upcoming', auth_1.authenticate, holidayController_1.getUpcomingHolidays);
app.get('/api/holidays/check/:date', auth_1.authenticate, holidayController_1.checkHoliday);
const server = (0, http_1.createServer)(app);
(0, websocket_1.initWebSocket)(server);
(0, swagger_1.setupSwagger)(app);
(0, monitoring_1.setupMetrics)(app);
app.use(errorHandler_1.notFoundHandler);
app.use((err, req, res, next) => {
    const route = req.route?.path || req.path;
    const statusCode = 'statusCode' in err ? err.statusCode : 500;
    const errorCode = 'code' in err ? err.code : errors_1.ErrorCodes.INTERNAL_ERROR;
    (0, monitoring_1.trackError)(req.method, route, statusCode, errorCode);
    (0, errorHandler_1.errorHandler)(err, req, res, next);
});
server.listen(PORT, () => {
    logger_1.default.info(`ForecastAI API running on port ${PORT}`);
    logger_1.default.info(`CORS origin: ${CORS_ORIGIN}`);
    logger_1.default.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    logger_1.default.info(`WebSocket server ready`);
    logger_1.default.info(`Swagger docs at http://localhost:${PORT}/api-docs`);
    logger_1.default.info(`Metrics at http://localhost:${PORT}/api/metrics`);
});
process.on('SIGTERM', () => {
    logger_1.default.info('SIGTERM received, shutting down gracefully');
    server.close(() => process.exit(0));
});
process.on('SIGINT', () => {
    logger_1.default.info('SIGINT received, shutting down gracefully');
    server.close(() => process.exit(0));
});
exports.default = app;
//# sourceMappingURL=index.js.map