"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMetrics = getMetrics;
exports.getAnomalies = getAnomalies;
exports.getCausalAnalysis = getCausalAnalysis;
exports.getCampaignAnalysis = getCampaignAnalysis;
exports.getSeasonality = getSeasonality;
exports.getROASOptimization = getROASOptimization;
exports.getDataValidation = getDataValidation;
exports.getOperationalInsights = getOperationalInsights;
const analyticsService_1 = require("../services/analyticsService");
const errorHandler_1 = require("../middleware/errorHandler");
const campaignAnalyzer_1 = require("../services/campaignAnalyzer");
const seasonalityDetector_1 = require("../services/seasonalityDetector");
const roasOptimizer_1 = require("../services/roasOptimizer");
const dataValidator_1 = require("../services/dataValidator");
const causalInference_1 = require("../services/causalInference");
const operationalInsights_1 = require("../services/operationalInsights");
async function getMetrics(req, res, next) {
    try {
        const { data, channel_budgets } = req.body;
        if (!data || !channel_budgets) {
            throw new errorHandler_1.ValidationError('data and channel_budgets are required');
        }
        const channelMetrics = analyticsService_1.analyticsService.computeChannelMetrics(data);
        const performanceMetrics = analyticsService_1.analyticsService.computePerformanceMetrics(data, channel_budgets);
        res.json({
            success: true,
            data: {
                channel_metrics: channelMetrics,
                performance_metrics: performanceMetrics,
            },
        });
    }
    catch (err) {
        next(err);
    }
}
async function getAnomalies(req, res, next) {
    try {
        const { data } = req.body;
        if (!data)
            throw new errorHandler_1.ValidationError('data is required');
        const { runForecastPipeline } = require('../services/mlService');
        const result = runForecastPipeline(data, { 'Google Ads': 10000, 'Meta Ads': 8000, 'Microsoft Ads': 5000 }, 30, 0.8, 500, {
            enableAnomalyDetection: true,
            enableCausalInference: false,
            enableCampaignDecomposition: false,
            enableRiskMetrics: false,
        });
        res.json({ success: true, data: result.anomalies || [] });
    }
    catch (err) {
        next(err);
    }
}
async function getCausalAnalysis(req, res, next) {
    try {
        const { data, channel_budgets } = req.body;
        if (!data)
            throw new errorHandler_1.ValidationError('data is required');
        const { runForecastPipeline } = require('../services/mlService');
        const result = runForecastPipeline(data, { 'Google Ads': 10000, 'Meta Ads': 8000, 'Microsoft Ads': 5000 }, 30, 0.8, 500, {
            enableAnomalyDetection: false,
            enableCausalInference: true,
            enableCampaignDecomposition: false,
            enableRiskMetrics: false,
        });
        const budgets = channel_budgets || { 'Google Ads': 10000, 'Meta Ads': 8000, 'Microsoft Ads': 5000 };
        const causalDrivers = result.causal_drivers || [];
        const channelForecasts = result.channel_forecasts || {};
        const causalAnalysis = causalInference_1.causalInferenceEngine.analyzeRevenueDrivers(data, channelForecasts, budgets);
        res.json({
            success: true,
            data: {
                causal_drivers: causalDrivers,
                causal_analysis: causalAnalysis,
            },
        });
    }
    catch (err) {
        next(err);
    }
}
async function getCampaignAnalysis(req, res, next) {
    try {
        const { data, channel_budgets } = req.body;
        if (!data)
            throw new errorHandler_1.ValidationError('data is required');
        const budgets = channel_budgets || { 'Google Ads': 10000, 'Meta Ads': 8000, 'Microsoft Ads': 5000 };
        const analysis = campaignAnalyzer_1.campaignAnalyzer.analyzeCampaigns(data, budgets);
        const { runForecastPipeline } = require('../services/mlService');
        const result = runForecastPipeline(data, budgets, 30, 0.8, 500, { enableAnomalyDetection: false, enableCausalInference: false, enableCampaignDecomposition: true, enableRiskMetrics: false });
        const channelForecasts = result.channel_forecasts || {};
        const campaignForecasts = campaignAnalyzer_1.campaignAnalyzer.forecastCampaigns(data, channelForecasts, {});
        res.json({
            success: true,
            data: {
                ...analysis,
                campaign_forecasts: campaignForecasts,
            },
        });
    }
    catch (err) {
        next(err);
    }
}
async function getSeasonality(req, res, next) {
    try {
        const { data } = req.body;
        if (!data)
            throw new errorHandler_1.ValidationError('data is required');
        const seasonality = seasonalityDetector_1.seasonalityDetector.detectSeasonality(data);
        res.json({ success: true, data: seasonality });
    }
    catch (err) {
        next(err);
    }
}
async function getROASOptimization(req, res, next) {
    try {
        const { data, channel_budgets, constraints } = req.body;
        if (!data || !channel_budgets)
            throw new errorHandler_1.ValidationError('data and channel_budgets are required');
        const { runForecastPipeline } = require('../services/mlService');
        const result = runForecastPipeline(data, channel_budgets, 30, 0.8, 500, { enableAnomalyDetection: false, enableCausalInference: false, enableCampaignDecomposition: false, enableRiskMetrics: false });
        const channelForecasts = result.channel_forecasts || {};
        const optimization = roasOptimizer_1.roasOptimizer.optimizeForROAS(channelForecasts, channel_budgets, constraints);
        res.json({ success: true, data: optimization });
    }
    catch (err) {
        next(err);
    }
}
async function getDataValidation(req, res, next) {
    try {
        const { data } = req.body;
        if (!data)
            throw new errorHandler_1.ValidationError('data is required');
        const validation = dataValidator_1.dataValidator.validateCampaignConsistency(data);
        const report = dataValidator_1.dataValidator.generateQualityReport(validation);
        res.json({
            success: true,
            data: {
                validation,
                report,
            },
        });
    }
    catch (err) {
        next(err);
    }
}
async function getOperationalInsights(req, res, next) {
    try {
        const { data, channel_budgets } = req.body;
        if (!data)
            throw new errorHandler_1.ValidationError('data is required');
        const budgets = channel_budgets || { 'Google Ads': 10000, 'Meta Ads': 8000, 'Microsoft Ads': 5000 };
        const { runForecastPipeline } = require('../services/mlService');
        const result = runForecastPipeline(data, budgets, 30, 0.8, 500, { enableAnomalyDetection: true, enableCausalInference: true, enableCampaignDecomposition: true, enableRiskMetrics: true });
        const seasonality = seasonalityDetector_1.seasonalityDetector.detectSeasonality(data);
        const campaignAnalysis = campaignAnalyzer_1.campaignAnalyzer.analyzeCampaigns(data, budgets);
        const insights = operationalInsights_1.operationalInsightsGenerator.generateInsights(result, result.anomalies || [], campaignAnalysis, seasonality);
        res.json({
            success: true,
            data: {
                insights,
                summary: {
                    forecast: { p10_revenue: result.p10_revenue, p50_revenue: result.p50_revenue, p90_revenue: result.p90_revenue },
                    anomalies_count: (result.anomalies || []).length,
                    top_campaigns: campaignAnalysis.topPerformers.slice(0, 3),
                },
            },
        });
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=analyticsController.js.map