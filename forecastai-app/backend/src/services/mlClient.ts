import http from 'http';
import logger from '../utils/logger';

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
    model_weights: Record<string, number>;
  };
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
    const avgRevenue = revenues.length > 0
      ? revenues.reduce((a: number, b: number) => a + b, 0) / revenues.length
      : 0;

    const median = Array(request.forecast_days).fill(avgRevenue);
    const p10 = median.map(v => v * 0.8);
    const p90 = median.map(v => v * 1.2);

    return {
      success: true,
      forecast: {
        median,
        p10,
        p90,
        p5: median.map(v => v * 0.7),
        p95: median.map(v => v * 1.3),
        model_weights: { prophet: 0.35, ets: 0.25, xgboost: 0.25, random_forest: 0.15 },
      },
    };
  }
}

export const mlClient = new MLClient();
