"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupMetrics = setupMetrics;
exports.monitoringMiddleware = monitoringMiddleware;
exports.trackError = trackError;
const prom_client_1 = __importDefault(require("prom-client"));
const jobQueue_1 = require("../services/jobQueue");
const httpRequestDuration = new prom_client_1.default.Histogram({
    name: 'http_request_duration_ms',
    help: 'Duration of HTTP requests in ms',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000],
});
const httpRequestsTotal = new prom_client_1.default.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
});
const httpErrorsTotal = new prom_client_1.default.Counter({
    name: 'http_errors_total',
    help: 'Total number of HTTP errors by error code',
    labelNames: ['method', 'route', 'status_code', 'error_code'],
});
const activeForecastJobs = new prom_client_1.default.Gauge({
    name: 'active_forecast_jobs',
    help: 'Number of active forecast jobs',
});
function setupMetrics(app) {
    prom_client_1.default.collectDefaultMetrics();
    app.get('/api/metrics', async (_req, res) => {
        res.set('Content-Type', prom_client_1.default.register.contentType);
        res.end(await prom_client_1.default.register.metrics());
    });
}
function monitoringMiddleware(req, res, next) {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        const route = req.route?.path || req.path;
        const statusCode = res.statusCode.toString();
        httpRequestDuration.labels(req.method, route, statusCode).observe(duration);
        httpRequestsTotal.labels(req.method, route, statusCode).inc();
    });
    next();
}
function trackError(method, route, statusCode, errorCode) {
    httpErrorsTotal.labels(method, route, statusCode.toString(), errorCode).inc();
}
setInterval(() => {
    activeForecastJobs.set(jobQueue_1.jobQueue.getActiveCount());
}, 5000);
//# sourceMappingURL=monitoring.js.map