export interface ROASConstraint {
    minROAS: number;
    targetROAS: number;
    maxBudget: number;
}
export interface OptimizedBudget {
    channel: string;
    currentBudget: number;
    optimizedBudget: number;
    expectedRevenue: number;
    expectedROAS: number;
    adjustment: number;
}
export declare class ROASOptimizer {
    private defaultConstraint;
    optimizeForROAS(channelForecasts: any, currentBudgets: Record<string, number>, constraints?: Record<string, ROASConstraint>): {
        optimizedBudgets: OptimizedBudget[];
        totalRevenueIncrease: number;
        totalROASImprovement: number;
        recommendations: string[];
    };
    private generateRecommendations;
    calculateROASConfidenceInterval(revenue: number[], budget: number, confidenceLevel?: number): {
        lower: number;
        upper: number;
        expected: number;
    };
}
export declare const roasOptimizer: ROASOptimizer;
//# sourceMappingURL=roasOptimizer.d.ts.map