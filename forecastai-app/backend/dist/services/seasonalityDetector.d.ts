export interface SeasonalPattern {
    name: string;
    startDate: string;
    endDate: string;
    multiplier: number;
    confidence: number;
}
export declare class SeasonalityDetector {
    private holidays;
    detectSeasonality(data: any[]): {
        patterns: SeasonalPattern[];
        weeklyPattern: number[];
        monthlyPattern: number[];
        recommendations: string[];
    };
    private aggregateDailyRevenue;
    private calculateWeeklyPattern;
    private calculateMonthlyPattern;
    private detectHolidayEffects;
    private generateRecommendations;
}
export declare const seasonalityDetector: SeasonalityDetector;
//# sourceMappingURL=seasonalityDetector.d.ts.map