export interface BudgetRecommendation {
  channel: string;
  current: number;
  recommended: number;
  reason: string;
}

interface ConfidenceAssessment {
  overall: string;
  data_quality: string;
  model_agreement: string;
  uncertainty_level: string;
}

export interface AIInsights {
  executive_summary: string;
  top_risks: string[];
  budget_recommendations: BudgetRecommendation[];
  seasonal_factors: string[];
  operational_insights: string;
  confidence_assessment: ConfidenceAssessment;
}

export interface Anomaly {
  date: string;
  channel: string;
  actual_revenue: number;
  expected_revenue: number;
  zscore: number;
  severity: string;
  cause: string;
}

export interface CausalDriver {
  driver: string;
  importance: number;
  direction: string;
  description: string;
}

interface RiskMetrics {
  value_at_risk_95: number;
  conditional_var_95: number;
  volatility: number;
  upside_potential: number;
  downside_risk: number;
  probability_of_loss: number;
  risk_reward_ratio: number;
  channel_risk_breakdown: Record<string, ChannelRisk>;
}

interface ChannelRisk {
  var_95: number;
  cvar_95: number;
  volatility: number;
}

export interface BacktestMetrics {
  mape: number;
  rmse: number;
  mae: number;
  r2: number;
  coverage_90: number;
  fold_metrics: FoldMetric[];
}

interface FoldMetric {
  fold: number;
  mape: number;
  rmse: number;
}

interface ChannelForecast {
  channel: string;
  median: number[];
  p5: number[];
  p10: number[];
  p90: number[];
  p95: number[];
  p25: number[];
  p75: number[];
  dates: string[];
  historical: number[];
  historical_dates: string[];
  total_revenue: number;
}

interface TotalForecast {
  median: number[];
  p5: number[];
  p10: number[];
  p90: number[];
  p95: number[];
  p25: number[];
  p75: number[];
  dates: string[];
  channel_breakdown: Record<string, number>;
  all_simulations: number[][];
}

interface MarginalROI {
  [channel: string]: {
    current_roas: number;
    marginal_roas: number;
    optimal_multiplier: number;
    saturation_point: number;
  };
}

interface CampaignAnalysis {
  campaign_types: Record<string, number>;
  top_campaigns: Array<{ name: string; revenue: number; roas: number }>;
}

interface ChannelMetrics {
  total_revenue: number;
  daily_avg_revenue: number;
  std_revenue: number;
  cv: number;
  trend: number;
  roas: number;
}

export interface ForecastResult {
  id: string;
  channel_forecasts: Record<string, ChannelForecast>;
  total_forecast: TotalForecast;
  p10_revenue: number;
  p50_revenue: number;
  p90_revenue: number;
  p5_revenue: number;
  p95_revenue: number;
  roas: number;
  confidence_score: number;
  total_budget: number;
  model_weights: Record<string, number>;
  ai_insights: AIInsights | null;
  backtest_metrics: BacktestMetrics | null;
  anomalies: Anomaly[] | null;
  causal_drivers: CausalDriver[] | null;
  marginal_roi: MarginalROI | null;
  campaign_analysis: CampaignAnalysis | null;
  risk_metrics: RiskMetrics | null;
  processing_time: number;
  cache_hit: boolean;
  channel_metrics: Record<string, ChannelMetrics>;
}

export interface BudgetSimulationResult {
  current_budget: number;
  new_budget: number;
  current_revenue: number;
  new_revenue: number;
  current_roas: number;
  new_roas: number;
  incremental_revenue: number;
  incremental_roas: number;
  impact: string;
}

export interface BudgetOptimizationResult {
  current_allocation: Record<string, number>;
  optimal_allocation: Record<string, number>;
  expected_revenue_increase: number;
  expected_roas_improvement: number;
  expected_additional_profit: number;
  channel_adjustments: Array<{
    channel: string;
    current: number;
    optimal: number;
    change_percent: number;
    expected_impact: string;
  }>;
}

export interface ElasticityData {
  channel: string;
  budgets: number[];
  revenues: number[];
  elasticities: number[];
  elasticity: number;
  optimal_multiplier: number;
}

export interface AnalyticsMetrics {
  channel_metrics: Record<string, ChannelMetrics>;
  performance_metrics: {
    mape: number;
    best_model: string;
    anomaly_count: number;
    confidence_score: number;
    rmse: number;
    r2: number;
  };
}
