export interface CausalFactor {
    name: string;
    impact: number;
    direction: 'positive' | 'negative';
    confidence: number;
    explanation: string;
}
export interface CausalAnalysis {
    topDrivers: CausalFactor[];
    recommendations: string[];
    riskFactors: string[];
    causalGraph: Record<string, string[]>;
}
export declare class CausalInferenceEngine {
    analyzeRevenueDrivers(data: any[], channelForecasts: any, budgets: Record<string, number>): CausalAnalysis;
    private generateRecommendations;
    private identifyRisks;
    private buildCausalGraph;
}
export declare const causalInferenceEngine: CausalInferenceEngine;
//# sourceMappingURL=causalInference.d.ts.map