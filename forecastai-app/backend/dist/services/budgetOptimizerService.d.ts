import { BudgetSimulationResult, BudgetOptimizationResult, ElasticityData } from '../models/ForecastResult';
export declare class BudgetOptimizerService {
    simulateBudgetChange(currentBudgets: Record<string, number>, targetChannel: string, percentageChange: number, baseForecastRevenue: number): BudgetSimulationResult;
    simulateMultipleScenarios(currentBudgets: Record<string, number>, baseRevenue: number, scenarios: Array<{
        channel: string;
        pctChange: number;
    }>): BudgetSimulationResult[];
    optimizeAllocation(currentBudgets: Record<string, number>, totalBudget: number, historicalRoas: Record<string, number>): BudgetOptimizationResult;
    getRevenueCurve(currentBudgets: Record<string, number>, baseRevenue: number, channel: string, pctRange?: number[], _steps?: number): ElasticityData;
}
export declare const budgetOptimizerService: BudgetOptimizerService;
//# sourceMappingURL=budgetOptimizerService.d.ts.map