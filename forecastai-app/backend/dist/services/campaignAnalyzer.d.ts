export interface CampaignMetrics {
    name: string;
    channel: string;
    type: 'brand' | 'non_brand' | 'remarketing' | 'shopping' | 'display' | 'other';
    revenue: number;
    roas: number;
    conversionRate: number;
    trend: 'increasing' | 'stable' | 'decreasing';
}
export interface CampaignForecast {
    campaignName: string;
    channel: string;
    campaignType: string;
    p10_revenue: number;
    p50_revenue: number;
    p90_revenue: number;
    p10_roas: number;
    p50_roas: number;
    p90_roas: number;
    confidence_score: number;
}
export declare class CampaignAnalyzer {
    private campaignTypes;
    detectCampaignType(campaignName: string): string;
    analyzeCampaigns(data: any[], channelBudgets: Record<string, number>): {
        campaigns: CampaignMetrics[];
        topPerformers: CampaignMetrics[];
        underperformers: CampaignMetrics[];
        recommendations: string[];
    };
    private generateRecommendations;
    forecastCampaigns(data: any[], channelForecasts: any, campaignBudgets: Record<string, number>): CampaignForecast[];
}
export declare const campaignAnalyzer: CampaignAnalyzer;
//# sourceMappingURL=campaignAnalyzer.d.ts.map