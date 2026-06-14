"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.forecastService = exports.ForecastService = void 0;
exports.parseCSVData = parseCSVData;
exports.normalizeChannel = normalizeChannel;
exports.validateData = validateData;
const uuid_1 = require("uuid");
const sync_1 = require("csv-parse/sync");
const mlService_1 = require("./mlService");
const cache_1 = require("../utils/cache");
const logger_1 = __importDefault(require("../utils/logger"));
function computeDataHash(data) {
    const str = JSON.stringify(data.slice(0, 100));
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
}
function parseCSVData(csvContent) {
    const records = (0, sync_1.parse)(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        relax_column_count: true,
    });
    const rows = [];
    for (const record of records) {
        const normalized = {};
        for (const [key, val] of Object.entries(record)) {
            const lowerKey = key.toLowerCase().trim();
            const strVal = String(val || '').trim();
            if (lowerKey === 'date')
                normalized['date'] = strVal;
            else if (lowerKey === 'revenue' || lowerKey === 'sales' || lowerKey === 'conversions_value') {
                normalized['revenue'] = parseFloat(strVal) || 0;
            }
            else if (lowerKey === 'channel' || lowerKey === 'source' || lowerKey === 'campaign') {
                normalized['channel'] = strVal;
            }
            else if (lowerKey === 'campaign_name' || lowerKey === 'campaign') {
                normalized['campaign_name'] = strVal;
            }
            else {
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
function normalizeChannel(name) {
    const lower = name.toLowerCase();
    if (lower.includes('google') || lower === 'google')
        return 'Google Ads';
    if (lower.includes('meta') || lower.includes('facebook') || lower === 'meta')
        return 'Meta Ads';
    if (lower.includes('microsoft') || lower.includes('bing') || lower === 'microsoft')
        return 'Microsoft Ads';
    return name;
}
function validateData(data) {
    const warnings = [];
    if (data.length === 0) {
        warnings.push('No valid data rows found');
        return warnings;
    }
    const channels = new Set(data.map(r => r.channel));
    if (channels.size === 0)
        warnings.push('No channels detected');
    const dateRegex = /^\d{4}-\d{2}-\d{2}/;
    const invalidDates = data.filter(r => !dateRegex.test(r.date));
    if (invalidDates.length > 0)
        warnings.push(`${invalidDates.length} rows have invalid dates`);
    const negativeRevenue = data.filter(r => r.revenue < 0);
    if (negativeRevenue.length > 0)
        warnings.push(`${negativeRevenue.length} rows have negative revenue`);
    return warnings;
}
class ForecastService {
    async generateForecast(csvContent, params) {
        const startTime = Date.now();
        const rawData = parseCSVData(csvContent);
        const warnings = validateData(rawData);
        for (const row of rawData) {
            row.channel = normalizeChannel(row.channel);
        }
        const dataHash = computeDataHash(rawData);
        const cacheKey = (0, cache_1.generateCacheKey)(dataHash, params);
        if (params.enable_caching) {
            const cached = (0, cache_1.getCachedResult)(cacheKey);
            if (cached) {
                logger_1.default.info('Returning cached forecast result');
                return { ...cached, cache_hit: true };
            }
        }
        logger_1.default.info(`Running forecast pipeline for ${rawData.length} rows across ${new Set(rawData.map(r => r.channel)).size} channels`);
        const result = (0, mlService_1.runForecastPipeline)(rawData, params.channel_budgets, params.forecast_days, params.confidence_level, params.n_simulations, {
            enableAnomalyDetection: params.enable_anomaly_detection ?? true,
            enableCausalInference: params.enable_causal_inference ?? true,
            enableCampaignDecomposition: params.enable_campaign_decomposition ?? true,
            enableRiskMetrics: params.enable_risk_metrics ?? true,
        });
        const processingTime = Date.now() - startTime;
        const forecastResult = {
            id: (0, uuid_1.v4)(),
            ...result,
            processing_time: processingTime,
            cache_hit: false,
        };
        if (params.enable_caching) {
            (0, cache_1.setCachedResult)(cacheKey, forecastResult);
        }
        logger_1.default.info(`Forecast completed in ${processingTime}ms`);
        return forecastResult;
    }
}
exports.ForecastService = ForecastService;
exports.forecastService = new ForecastService();
//# sourceMappingURL=forecastService.js.map