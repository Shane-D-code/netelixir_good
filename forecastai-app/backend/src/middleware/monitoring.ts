import { Request, Response, NextFunction } from 'express';
import client from 'prom-client';
import { jobQueue } from '../services/jobQueue';

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000],
});

const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

const httpErrorsTotal = new client.Counter({
  name: 'http_errors_total',
  help: 'Total number of HTTP errors by error code',
  labelNames: ['method', 'route', 'status_code', 'error_code'],
});

const activeForecastJobs = new client.Gauge({
  name: 'active_forecast_jobs',
  help: 'Number of active forecast jobs',
});

export function setupMetrics(app: any) {
  client.collectDefaultMetrics();
  app.get('/api/metrics', async (_req: Request, res: Response) => {
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
  });
}

export function monitoringMiddleware(req: Request, res: Response, next: NextFunction) {
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

export function trackError(method: string, route: string, statusCode: number, errorCode: string): void {
  httpErrorsTotal.labels(method, route, statusCode.toString(), errorCode).inc();
}

setInterval(() => {
  activeForecastJobs.set(jobQueue.getActiveCount());
}, 5000);
