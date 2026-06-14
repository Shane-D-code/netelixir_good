import {
  BudgetSimulationResult,
  BudgetOptimizationResult,
  ElasticityData,
} from '../models/ForecastResult';

const CHANNEL_ELASTICITIES: Record<string, number> = {
  'Google Ads': 0.7,
  'Meta Ads': 0.9,
  'Microsoft Ads': 0.6,
};

export class BudgetOptimizerService {
  simulateBudgetChange(
    currentBudgets: Record<string, number>,
    targetChannel: string,
    percentageChange: number,
    baseForecastRevenue: number
  ): BudgetSimulationResult {
    const elasticity = CHANNEL_ELASTICITIES[targetChannel] || 0.5;
    const currentBudget = currentBudgets[targetChannel] || 0;
    const newBudget = currentBudget * (1 + percentageChange / 100);
    const ratio = currentBudget > 0 ? newBudget / currentBudget : 1;

    const channelShare = currentBudget / (Object.values(currentBudgets).reduce((a, b) => a + b, 0) || 1);
    const currentRevenue = baseForecastRevenue * channelShare;

    const revenueMultiplier = Math.pow(ratio, elasticity);
    const newRevenue = currentRevenue * revenueMultiplier;

    const currentRoas = currentBudget > 0 ? currentRevenue / currentBudget : 0;
    const newRoas = newBudget > 0 ? newRevenue / newBudget : 0;

    const incrementalRevenue = newRevenue - currentRevenue;

    let impact = 'neutral';
    if (newRoas > currentRoas * 1.1) impact = 'positive';
    else if (newRoas < currentRoas * 0.9) impact = 'negative';

    return {
      current_budget: Math.round(currentBudget * 100) / 100,
      new_budget: Math.round(newBudget * 100) / 100,
      current_revenue: Math.round(currentRevenue * 100) / 100,
      new_revenue: Math.round(newRevenue * 100) / 100,
      current_roas: Math.round(currentRoas * 100) / 100,
      new_roas: Math.round(newRoas * 100) / 100,
      incremental_revenue: Math.round(incrementalRevenue * 100) / 100,
      incremental_roas: Math.round((newRoas - currentRoas) * 100) / 100,
      impact,
    };
  }

  simulateMultipleScenarios(
    currentBudgets: Record<string, number>,
    baseRevenue: number,
    scenarios: Array<{ channel: string; pctChange: number }>
  ): BudgetSimulationResult[] {
    return scenarios.map(s =>
      this.simulateBudgetChange(currentBudgets, s.channel, s.pctChange, baseRevenue)
    );
  }

  optimizeAllocation(
    currentBudgets: Record<string, number>,
    totalBudget: number,
    historicalRoas: Record<string, number>
  ): BudgetOptimizationResult {
    const totalRoas = Object.values(historicalRoas).reduce((a, b) => a + b, 0);
    const channelAdjustments: Array<{
      channel: string;
      current: number;
      optimal: number;
      change_percent: number;
      expected_impact: string;
    }> = [];

    let optimalAllocation: Record<string, number> = {};

    for (const [channel, roas] of Object.entries(historicalRoas)) {
      const weight = totalRoas > 0 ? roas / totalRoas : 1 / Object.keys(historicalRoas).length;
      optimalAllocation[channel] = totalBudget * weight;
    }

    const diff = totalBudget - Object.values(optimalAllocation).reduce((a, b) => a + b, 0);
    const channels = Object.keys(optimalAllocation);
    if (channels.length > 0) {
      const perChannel = diff / channels.length;
      for (const ch of channels) {
        optimalAllocation[ch] = Math.max(0, optimalAllocation[ch] + perChannel);
      }
    }

    const normalizationFactor = totalBudget / Math.max(1, Object.values(optimalAllocation).reduce((a, b) => a + b, 0));
    for (const ch of Object.keys(optimalAllocation)) {
      optimalAllocation[ch] = Math.round(optimalAllocation[ch] * normalizationFactor * 100) / 100;
    }

    let expectedRevenueIncrease = 0;
    let expectedRoasImprovement = 0;

    for (const channel of Object.keys(currentBudgets)) {
      const current = currentBudgets[channel] || 0;
      const optimal = optimalAllocation[channel] || 0;
      const elasticity = CHANNEL_ELASTICITIES[channel] || 0.5;

      if (current > 0 && optimal > 0) {
        const ratio = optimal / current;
        const revIncrease = Math.pow(ratio, elasticity) - 1;
        expectedRevenueIncrease += revIncrease * (current / totalBudget);
      }

      const currentRoas = historicalRoas[channel] || 0;
      const optimalRoas = currentRoas * (1 + (optimal - current) / Math.max(1, current) * 0.3);
      expectedRoasImprovement += (optimalRoas - currentRoas) * (optimal / totalBudget);

      const changePercent = current > 0 ? ((optimal - current) / current * 100) : 0;
      let expectedImpact = 'neutral';
      if (changePercent > 10) expectedImpact = 'Increase budget for higher returns';
      else if (changePercent < -10) expectedImpact = 'Reduce budget to improve efficiency';
      else expectedImpact = 'Maintain current allocation';

      channelAdjustments.push({
        channel,
        current: Math.round(current * 100) / 100,
        optimal: Math.round(optimal * 100) / 100,
        change_percent: Math.round(changePercent * 100) / 100,
        expected_impact: expectedImpact,
      });
    }

    const currentTotalRevenue = Object.entries(currentBudgets).reduce((sum, [ch, b]) => {
      return sum + b * (historicalRoas[ch] || 0);
    }, 0);

    const expectedAdditionalProfit = expectedRevenueIncrease * currentTotalRevenue;

    return {
      current_allocation: currentBudgets,
      optimal_allocation: optimalAllocation,
      expected_revenue_increase: Math.round(expectedRevenueIncrease * 10000) / 100,
      expected_roas_improvement: Math.round(expectedRoasImprovement * 100) / 100,
      expected_additional_profit: Math.round(expectedAdditionalProfit * 100) / 100,
      channel_adjustments: channelAdjustments,
    };
  }

  getRevenueCurve(
    currentBudgets: Record<string, number>,
    baseRevenue: number,
    channel: string,
    pctRange: number[] = Array.from({ length: 16 }, (_, i) => -50 + i * 10),
    _steps: number = 16
  ): ElasticityData {
    const elasticity = CHANNEL_ELASTICITIES[channel] || 0.5;
    const budgets: number[] = [];
    const revenues: number[] = [];
    const elasticities: number[] = [];

    const currentBudget = currentBudgets[channel] || 0;
    const channelRevenue = baseRevenue * (currentBudget / Math.max(1, Object.values(currentBudgets).reduce((a, b) => a + b, 0)));

    for (const pct of pctRange) {
      const newBudget = currentBudget * (1 + pct / 100);
      const ratio = currentBudget > 0 ? newBudget / Math.max(1, currentBudget) : 1;
      const revenueMultiplier = Math.pow(ratio, elasticity);
      const newRevenue = channelRevenue * revenueMultiplier;

      budgets.push(Math.round(newBudget * 100) / 100);
      revenues.push(Math.round(newRevenue * 100) / 100);
      elasticities.push(elasticity);
    }

    const optimalMultiplier = elasticity > 0.8 ? 1.8 : elasticity > 0.65 ? 1.3 : 1.1;
    return { channel, budgets, revenues, elasticities, elasticity, optimal_multiplier: optimalMultiplier };
  }
}

export const budgetOptimizerService = new BudgetOptimizerService();
