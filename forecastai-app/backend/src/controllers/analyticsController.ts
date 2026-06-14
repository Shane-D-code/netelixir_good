import { Request, Response, NextFunction } from 'express';
import { analyticsService } from '../services/analyticsService';
import { ValidationError } from '../middleware/errorHandler';
import { campaignAnalyzer } from '../services/campaignAnalyzer';
import { seasonalityDetector } from '../services/seasonalityDetector';
import { roasOptimizer } from '../services/roasOptimizer';
import { dataValidator } from '../services/dataValidator';
import { causalInferenceEngine } from '../services/causalInference';
import { operationalInsightsGenerator } from '../services/operationalInsights';
import logger from '../utils/logger';

export async function getMetrics(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { data, channel_budgets } = req.body;
    if (!data || !channel_budgets) {
      throw new ValidationError('data and channel_budgets are required');
    }

    const channelMetrics = analyticsService.computeChannelMetrics(data);
    const performanceMetrics = analyticsService.computePerformanceMetrics(data, channel_budgets);

    res.json({
      success: true,
      data: {
        channel_metrics: channelMetrics,
        performance_metrics: performanceMetrics,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getAnomalies(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { data } = req.body;
    if (!data) throw new ValidationError('data is required');

    const { runForecastPipeline } = require('../services/mlService');
    const result = runForecastPipeline(
      data,
      { 'Google Ads': 10000, 'Meta Ads': 8000, 'Microsoft Ads': 5000 },
      30, 0.8, 500,
      {
        enableAnomalyDetection: true,
        enableCausalInference: false,
        enableCampaignDecomposition: false,
        enableRiskMetrics: false,
      }
    );

    res.json({ success: true, data: result.anomalies || [] });
  } catch (err) {
    next(err);
  }
}

export async function getCausalAnalysis(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { data, channel_budgets } = req.body;
    if (!data) throw new ValidationError('data is required');

    const { runForecastPipeline } = require('../services/mlService');
    const result = runForecastPipeline(
      data,
      { 'Google Ads': 10000, 'Meta Ads': 8000, 'Microsoft Ads': 5000 },
      30, 0.8, 500,
      {
        enableAnomalyDetection: false,
        enableCausalInference: true,
        enableCampaignDecomposition: false,
        enableRiskMetrics: false,
      }
    );

    const budgets = channel_budgets || { 'Google Ads': 10000, 'Meta Ads': 8000, 'Microsoft Ads': 5000 };
    const causalDrivers = result.causal_drivers || [];
    const channelForecasts = result.channel_forecasts || {};
    const causalAnalysis = causalInferenceEngine.analyzeRevenueDrivers(data, channelForecasts, budgets);

    res.json({
      success: true,
      data: {
        causal_drivers: causalDrivers,
        causal_analysis: causalAnalysis,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getCampaignAnalysis(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { data, channel_budgets } = req.body;
    if (!data) throw new ValidationError('data is required');

    const budgets = channel_budgets || { 'Google Ads': 10000, 'Meta Ads': 8000, 'Microsoft Ads': 5000 };
    const analysis = campaignAnalyzer.analyzeCampaigns(data, budgets);

    const { runForecastPipeline } = require('../services/mlService');
    const result = runForecastPipeline(
      data, budgets, 30, 0.8, 500,
      { enableAnomalyDetection: false, enableCausalInference: false, enableCampaignDecomposition: true, enableRiskMetrics: false }
    );

    const channelForecasts = result.channel_forecasts || {};
    const campaignForecasts = campaignAnalyzer.forecastCampaigns(data, channelForecasts, {});

    res.json({
      success: true,
      data: {
        ...analysis,
        campaign_forecasts: campaignForecasts,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getSeasonality(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { data } = req.body;
    if (!data) throw new ValidationError('data is required');

    const seasonality = seasonalityDetector.detectSeasonality(data);

    res.json({ success: true, data: seasonality });
  } catch (err) {
    next(err);
  }
}

export async function getROASOptimization(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { data, channel_budgets, constraints } = req.body;
    if (!data || !channel_budgets) throw new ValidationError('data and channel_budgets are required');

    const { runForecastPipeline } = require('../services/mlService');
    const result = runForecastPipeline(
      data, channel_budgets, 30, 0.8, 500,
      { enableAnomalyDetection: false, enableCausalInference: false, enableCampaignDecomposition: false, enableRiskMetrics: false }
    );

    const channelForecasts = result.channel_forecasts || {};
    const optimization = roasOptimizer.optimizeForROAS(channelForecasts, channel_budgets, constraints);

    res.json({ success: true, data: optimization });
  } catch (err) {
    next(err);
  }
}

export async function getDataValidation(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { data } = req.body;
    if (!data) throw new ValidationError('data is required');

    const validation = dataValidator.validateCampaignConsistency(data);
    const report = dataValidator.generateQualityReport(validation);

    res.json({
      success: true,
      data: {
        validation,
        report,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getOperationalInsights(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { data, channel_budgets } = req.body;
    if (!data) throw new ValidationError('data is required');

    const budgets = channel_budgets || { 'Google Ads': 10000, 'Meta Ads': 8000, 'Microsoft Ads': 5000 };

    const { runForecastPipeline } = require('../services/mlService');
    const result = runForecastPipeline(
      data, budgets, 30, 0.8, 500,
      { enableAnomalyDetection: true, enableCausalInference: true, enableCampaignDecomposition: true, enableRiskMetrics: true }
    );

    const seasonality = seasonalityDetector.detectSeasonality(data);
    const campaignAnalysis = campaignAnalyzer.analyzeCampaigns(data, budgets);

    const insights = operationalInsightsGenerator.generateInsights(
      result,
      result.anomalies || [],
      campaignAnalysis,
      seasonality
    );

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
  } catch (err) {
    next(err);
  }
}
