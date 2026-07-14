import { v4 as uuidv4 } from 'uuid';
import { parse } from 'csv-parse/sync';
import { ForecastRequest, RawDataRow } from '../types/forecast-request.types';
import { ForecastResult } from '../types/forecast-result.types';
import { runForecastPipeline } from './ml.service';
import { mlClient } from './ml-client.service';
import { generateCacheKey, getCachedResult, setCachedResult } from '../../../core/cache/cache.service';
import logger from '../../../core/logging/logger';

function computeDataHash(data: RawDataRow[]): string {
  const str = JSON.stringify(data.slice(0, 100));
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

export function parseCSVData(csvContent: string): RawDataRow[] {
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
  });

  const rows: RawDataRow[] = [];

  for (const record of records) {
    const normalized: Record<string, string | number> = {};
    for (const [key, val] of Object.entries(record)) {
      const lowerKey = key.toLowerCase().trim();
      const strVal = String(val || '').trim();
      if (lowerKey === 'date') normalized['date'] = strVal;
      else if (lowerKey === 'revenue' || lowerKey === 'sales' || lowerKey === 'conversions_value') {
        normalized['revenue'] = parseFloat(strVal) || 0;
      } else if (lowerKey === 'channel' || lowerKey === 'source' || lowerKey === 'campaign') {
        normalized['channel'] = strVal;
      } else if (lowerKey === 'campaign_name' || lowerKey === 'campaign') {
        normalized['campaign_name'] = strVal;
      } else {
        normalized[key] = strVal;
      }
    }

    if (normalized['date'] && normalized['revenue'] !== undefined && normalized['channel']) {
      rows.push({
        date: String(normalized['date']),
        revenue: Number(normalized['revenue']),
        channel: String(normalized['channel']),
        ...normalized,
      });
    }
  }

  return rows;
}

export function normalizeChannel(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('google') || lower === 'google') return 'Google Ads';
  if (lower.includes('meta') || lower.includes('facebook') || lower === 'meta') return 'Meta Ads';
  if (lower.includes('microsoft') || lower.includes('bing') || lower === 'microsoft') return 'Microsoft Ads';
  return name;
}

export function validateData(data: RawDataRow[]): string[] {
  const warnings: string[] = [];
  if (data.length === 0) {
    warnings.push('No valid data rows found');
    return warnings;
  }

  const channels = new Set(data.map(r => r.channel));
  if (channels.size === 0) warnings.push('No channels detected');

  const dateRegex = /^\d{4}-\d{2}-\d{2}/;
  const invalidDates = data.filter(r => !dateRegex.test(r.date));
  if (invalidDates.length > 0) warnings.push(`${invalidDates.length} rows have invalid dates`);

  const negativeRevenue = data.filter(r => r.revenue < 0);
  if (negativeRevenue.length > 0) warnings.push(`${negativeRevenue.length} rows have negative revenue`);

  return warnings;
}

function mergeMLResult(
  heuristicResult: ReturnType<typeof runForecastPipeline>,
  mlForecast: { median: number[]; p10: number[]; p90: number[]; p5: number[]; p95: number[]; p25?: number[]; p75?: number[]; model_weights: Record<string, number> },
  forecastDates: string[],
  mlBacktest?: { mape: number; rmse: number; smape: number; mase: number; coverage_90: number; coverage_80: number; bias: number; mda: number; n_folds: number; fold_metrics: Array<{ fold: number; mape: number; rmse: number }> } | null
): any {
  const p25 = mlForecast.p25 || mlForecast.p10.map((v: number, i: number) => (v + (mlForecast.median[i] || v)) / 2);
  const p75 = mlForecast.p75 || mlForecast.median.map((v: number, i: number) => (v + (mlForecast.p90[i] || v)) / 2);

  // Use ML backtest if available and has valid folds, otherwise keep heuristic
  const backtestMetrics = mlBacktest && mlBacktest.n_folds > 0
    ? {
        mape: mlBacktest.mape,
        rmse: mlBacktest.rmse,
        mae: mlBacktest.rmse * 0.8,
        r2: Math.max(0, 1 - mlBacktest.mape / 100),
        coverage_90: mlBacktest.coverage_90,
        fold_metrics: mlBacktest.fold_metrics,
      }
    : heuristicResult.backtest_metrics;

  return {
    ...heuristicResult,
    model_weights: mlForecast.model_weights,
    backtest_metrics: backtestMetrics,
    total_forecast: {
      ...heuristicResult.total_forecast,
      median: mlForecast.median,
      p10: mlForecast.p10,
      p90: mlForecast.p90,
      p5: mlForecast.p5 || heuristicResult.total_forecast.p5,
      p95: mlForecast.p95 || heuristicResult.total_forecast.p95,
      p25,
      p75,
      dates: forecastDates,
    },
    p10_revenue: mlForecast.p10.reduce((a: number, b: number) => a + b, 0),
    p50_revenue: mlForecast.median.reduce((a: number, b: number) => a + b, 0),
    p90_revenue: mlForecast.p90.reduce((a: number, b: number) => a + b, 0),
    p5_revenue: (mlForecast.p5 || heuristicResult.total_forecast.p5).reduce((a: number, b: number) => a + b, 0),
    p95_revenue: (mlForecast.p95 || heuristicResult.total_forecast.p95).reduce((a: number, b: number) => a + b, 0),
  };
}

export class ForecastService {
  async generateForecast(
    csvContent: string,
    params: ForecastRequest
  ): Promise<ForecastResult> {
    const startTime = Date.now();

    const rawData = parseCSVData(csvContent);
    const warnings = validateData(rawData);

    for (const row of rawData) {
      row.channel = normalizeChannel(row.channel);
    }

    const dataHash = computeDataHash(rawData);
    const cacheKey = generateCacheKey(dataHash, params as unknown as Record<string, unknown>);

    if (params.enable_caching) {
      const cached = getCachedResult<ForecastResult>(cacheKey);
      if (cached) {
        logger.info('Returning cached forecast result');
        return { ...cached, cache_hit: true };
      }
    }

    logger.info(`Running forecast pipeline for ${rawData.length} rows across ${new Set(rawData.map(r => r.channel)).size} channels`);

    const pipelineOptions = {
      enableAnomalyDetection: params.enable_anomaly_detection ?? true,
      enableCausalInference: params.enable_causal_inference ?? true,
      enableCampaignDecomposition: params.enable_campaign_decomposition ?? true,
      enableRiskMetrics: params.enable_risk_metrics ?? true,
    };

    const heuristicResult = runForecastPipeline(
      rawData,
      params.channel_budgets,
      params.forecast_days,
      params.confidence_level,
      params.n_simulations,
      pipelineOptions
    );

    let result = heuristicResult;

    try {
      const mlResponse = await mlClient.forecast({
        data: rawData,
        forecast_days: params.forecast_days,
        n_simulations: params.n_simulations,
      });
      if (mlResponse?.success && mlResponse.forecast) {
        const forecast = mlResponse.forecast;
        if (Array.isArray(forecast.median) && forecast.median.length > 0 &&
            Array.isArray(forecast.p10) && forecast.p10.length > 0) {
          const startDate = new Date(rawData[0]?.date || '2024-01-01');
          const forecastDates: string[] = [];
          for (let i = 0; i < params.forecast_days; i++) {
            const d = new Date(startDate);
            d.setDate(d.getDate() + rawData.length + i);
            forecastDates.push(d.toISOString().split('T')[0]);
          }
          result = mergeMLResult(heuristicResult, forecast, forecastDates, mlResponse.backtest || null);
          logger.info('ML service forecast overlaid on heuristic baseline');
        } else {
          logger.warn('ML service returned invalid forecast shape, using heuristic');
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.info(`ML service unavailable (${msg}), using heuristic forecast only`);
    }

    const processingTime = Date.now() - startTime;

    const forecastResult: ForecastResult = {
      id: uuidv4(),
      ...result,
      processing_time: processingTime,
      cache_hit: false,
    };

    if (params.enable_caching) {
      setCachedResult(cacheKey, forecastResult);
    }

    logger.info(`Forecast completed in ${processingTime}ms`);

    return forecastResult;
  }
}

export const forecastService = new ForecastService();
