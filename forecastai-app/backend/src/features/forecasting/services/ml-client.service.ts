import http from 'http';
import logger from '../../../core/logging/logger';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8001';

function parseUrl(url: string): { hostname: string; port: number } {
  const withoutProtocol = url.replace(/^https?:\/\//, '');
  const parts = withoutProtocol.split(':');
  return {
    hostname: parts[0],
    port: parts[1] ? parseInt(parts[1], 10) : 8001,
  };
}

function httpRequest(method: string, path: string, body?: any, timeout = 30000): Promise<any> {
  const { hostname, port } = parseUrl(ML_SERVICE_URL);

  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : undefined;
    const options: http.RequestOptions = {
      hostname,
      port,
      path,
      method,
      timeout,
      headers: {
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data).toString() } : {}),
      },
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => { responseData += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(responseData));
        } catch {
          resolve(responseData);
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timed out')); });

    if (data) req.write(data);
    req.end();
  });
}

export interface MLForecastRequest {
  data: any[];
  forecast_days: number;
  n_simulations?: number;
}

export interface MLForecastResponse {
  success: boolean;
  forecast: {
    median: number[];
    p10: number[];
    p90: number[];
    p5: number[];
    p95: number[];
    p25?: number[];
    p75?: number[];
    mean?: number[];
    model_weights: Record<string, number>;
  };
  model_weights?: Record<string, number>;
  backtest?: {
    mape: number;
    rmse: number;
    smape: number;
    mase: number;
    coverage_90: number;
    coverage_80: number;
    bias: number;
    mda: number;
    n_folds: number;
    fold_metrics: Array<{ fold: number; mape: number; rmse: number }>;
  } | null;
  seasonality?: {
    period: number;
    confidence: number;
    seasonal_indices: number[];
    strength: number;
  } | null;
  processing_time?: number;
  model_version?: string;
}

export interface AnomalyDetectionResponse {
  success: boolean;
  anomalies: Array<{
    date: string;
    revenue: number;
    zscore: number;
    severity: 'high' | 'medium';
  }>;
}

export class MLClient {
  async forecast(request: MLForecastRequest): Promise<MLForecastResponse> {
    try {
      logger.info(`Calling ML service at ${ML_SERVICE_URL}/forecast`);
      const response = await httpRequest('POST', '/forecast', request, 120000);
      logger.info('ML service forecast successful');
      return response as MLForecastResponse;
    } catch (error: any) {
      logger.warn(`ML service unavailable (${error.message}), falling back to heuristic forecast`);
      return this.fallbackForecast(request);
    }
  }

  async detectAnomalies(data: any[]): Promise<AnomalyDetectionResponse> {
    try {
      const response = await httpRequest('POST', '/anomalies', { data }, 30000);
      return response as AnomalyDetectionResponse;
    } catch (error: any) {
      logger.warn(`ML anomaly detection unavailable (${error.message}), returning empty`);
      return { success: true, anomalies: [] };
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await httpRequest('GET', '/health', undefined, 5000);
      return true;
    } catch {
      return false;
    }
  }

  private fallbackForecast(request: MLForecastRequest): MLForecastResponse {
    const revenues = request.data.map((d: any) => d.revenue || 0);
    if (revenues.length === 0) {
      const zero = Array(request.forecast_days).fill(0);
      return {
        success: true,
        forecast: { median: zero, p10: zero, p90: zero, p5: zero, p95: zero, model_weights: { fallback: 1 } },
      };
    }

    const avgRevenue = revenues.reduce((a: number, b: number) => a + b, 0) / revenues.length;
    const last = revenues[revenues.length - 1];
    const n = revenues.length;
    const trend = n > 7 ? (last - revenues[n - 7]) / 7 : 0;
    const weekSize = Math.min(7, n);
    const lastWeek = revenues.slice(-weekSize);
    const weekMean = lastWeek.reduce((a: number, b: number) => a + b, 0) / weekSize;
    const normalizedWeek = lastWeek.map(v => v - weekMean);

    const median = Array.from({ length: request.forecast_days }, (_, i) =>
      Math.max(0, last + trend * (i + 1) + (normalizedWeek[i % weekSize] || 0))
    );

    const spread = avgRevenue * 0.15;
    return {
      success: true,
      forecast: {
        median,
        p10: median.map(v => Math.max(0, v - spread)),
        p90: median.map(v => v + spread),
        p5: median.map(v => Math.max(0, v - spread * 1.5)),
        p95: median.map(v => v + spread * 1.5),
        model_weights: { simple_trend: 1.0 },
      },
    };
  }
}

export const mlClient = new MLClient();
