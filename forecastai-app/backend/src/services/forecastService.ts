import { v4 as uuidv4 } from 'uuid';
import { parse } from 'csv-parse/sync';
import { ForecastRequest, RawDataRow } from '../models/ForecastRequest';
import { ForecastResult } from '../models/ForecastResult';
import { runForecastPipeline } from './mlService';
import { generateCacheKey, getCachedResult, setCachedResult } from '../utils/cache';
import logger from '../utils/logger';

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

    const result = runForecastPipeline(
      rawData,
      params.channel_budgets,
      params.forecast_days,
      params.confidence_level,
      params.n_simulations,
      {
        enableAnomalyDetection: params.enable_anomaly_detection ?? true,
        enableCausalInference: params.enable_causal_inference ?? true,
        enableCampaignDecomposition: params.enable_campaign_decomposition ?? true,
        enableRiskMetrics: params.enable_risk_metrics ?? true,
      }
    );

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
