export interface ForecastAccuracy {
    mape: number;
    mae: number;
    rmse: number;
    r2: number;
    bias: number;
    coverage_90: number;
}
export declare class ForecastComparison {
    compare(actual: number[], forecast: number[]): ForecastAccuracy;
    compareScenarios(actual: number[], forecasts: Record<string, number[]>): Record<string, ForecastAccuracy>;
}
//# sourceMappingURL=forecastComparison.d.ts.map