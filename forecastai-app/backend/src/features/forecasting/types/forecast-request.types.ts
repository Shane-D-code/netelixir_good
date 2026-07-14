export interface ForecastRequest {
  channel_budgets: Record<string, number>;
  forecast_days: number;
  confidence_level: number;
  n_simulations: number;
  enable_enhanced: boolean;
  enable_ai_insights: boolean;
  enable_caching: boolean;
  enable_anomaly_detection: boolean;
  enable_causal_inference: boolean;
  enable_campaign_decomposition: boolean;
  enable_risk_metrics: boolean;
}

export interface RawDataRow {
  date: string;
  revenue: number;
  channel: string;
  [key: string]: string | number;
}
