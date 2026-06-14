export interface OperationalInsight {
    category: 'budget' | 'timing' | 'channel' | 'campaign' | 'risk';
    priority: 'high' | 'medium' | 'low';
    insight: string;
    action: string;
    expectedOutcome: string;
}
export declare class OperationalInsightsGenerator {
    generateInsights(forecast: any, anomalies: any[], campaigns: any, seasonality: any): OperationalInsight[];
}
export declare const operationalInsightsGenerator: OperationalInsightsGenerator;
//# sourceMappingURL=operationalInsights.d.ts.map