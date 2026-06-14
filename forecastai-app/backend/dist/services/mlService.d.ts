import { RawDataRow } from '../models/ForecastRequest';
declare function detectAnomalies(data: Array<{
    date: string;
    channel: string;
    revenue: number;
}>): Array<{
    date: string;
    channel: string;
    actual_revenue: number;
    expected_revenue: number;
    zscore: number;
    severity: string;
    cause: string;
}>;
declare function estimateCausalDrivers(data: Array<{
    date: string;
    channel: string;
    revenue: number;
}>, channelValues: Record<string, number[]>): Array<{
    driver: string;
    importance: number;
    direction: string;
    description: string;
}>;
declare function analyzeCampaigns(data: RawDataRow[]): {
    campaign_types: Record<string, number>;
    top_campaigns: Array<{
        name: string;
        revenue: number;
        roas: number;
    }>;
};
declare function computeRiskMetrics(simulations: number[][], channelSimulations: Record<string, number[][]>, targetRevenue?: number): {
    value_at_risk_95: number;
    conditional_var_95: number;
    volatility: number;
    upside_potential: number;
    downside_risk: number;
    probability_of_loss: number;
    risk_reward_ratio: number;
    channel_risk_breakdown: Record<string, {
        var_95: number;
        cvar_95: number;
        volatility: number;
    }>;
};
declare function computeMarginalROI(channelData: Record<string, number[]>, channelBudgets: Record<string, number>): Record<string, {
    current_roas: number;
    marginal_roas: number;
    optimal_multiplier: number;
    saturation_point: number;
}>;
declare function walkForwardBacktest(values: number[], h: number): {
    mape: number;
    rmse: number;
    mae: number;
    r2: number;
    coverage_90: number;
    fold_metrics: Array<{
        fold: number;
        mape: number;
        rmse: number;
    }>;
};
declare function generateAIInsights(result: {
    p50_revenue: number;
    p10_revenue: number;
    p90_revenue: number;
    roas: number;
    total_budget: number;
    model_weights: Record<string, number>;
    channel_forecasts: Record<string, {
        channel: string;
        total_revenue: number;
    }>;
    anomalies: Array<{
        severity: string;
    }> | null;
    risk_metrics: {
        probability_of_loss: number;
        value_at_risk_95: number;
    } | null;
}): {
    executive_summary: string;
    top_risks: string[];
    budget_recommendations: Array<{
        channel: string;
        current: number;
        recommended: number;
        reason: string;
    }>;
    seasonal_factors: string[];
    operational_insights: string;
    confidence_assessment: {
        overall: string;
        data_quality: string;
        model_agreement: string;
        uncertainty_level: string;
    };
};
export declare function runForecastPipeline(data: RawDataRow[], channelBudgets: Record<string, number>, forecastDays: number, confidenceLevel: number, nSimulations: number, options: {
    enableAnomalyDetection: boolean;
    enableCausalInference: boolean;
    enableCampaignDecomposition: boolean;
    enableRiskMetrics: boolean;
}): {
    channel_forecasts: Record<string, {
        channel: string;
        median: number[];
        p10: number[];
        p90: number[];
        p25: number[];
        p75: number[];
        dates: string[];
        historical: number[];
        historical_dates: string[];
        total_revenue: number;
    }>;
    total_forecast: {
        median: number[];
        p10: number[];
        p90: number[];
        p25: number[];
        p75: number[];
        dates: string[];
        channel_breakdown: Record<string, number>;
        all_simulations: number[][];
    };
    p10_revenue: number;
    p50_revenue: number;
    p90_revenue: number;
    roas: number;
    confidence_score: number;
    total_budget: number;
    model_weights: Record<string, number>;
    ai_insights: ReturnType<typeof generateAIInsights> | null;
    backtest_metrics: ReturnType<typeof walkForwardBacktest> | null;
    anomalies: ReturnType<typeof detectAnomalies> | null;
    causal_drivers: ReturnType<typeof estimateCausalDrivers> | null;
    marginal_roi: ReturnType<typeof computeMarginalROI> | null;
    campaign_analysis: ReturnType<typeof analyzeCampaigns> | null;
    risk_metrics: ReturnType<typeof computeRiskMetrics> | null;
    channel_metrics: Record<string, {
        total_revenue: number;
        daily_avg_revenue: number;
        std_revenue: number;
        cv: number;
        trend: number;
        roas: number;
    }>;
};
export {};
//# sourceMappingURL=mlService.d.ts.map