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

export class ROASOptimizer {
  private defaultConstraint: ROASConstraint = { minROAS: 2.0, targetROAS: 3.0, maxBudget: 200000 };

  optimizeForROAS(
    channelForecasts: any,
    currentBudgets: Record<string, number>,
    constraints: Record<string, ROASConstraint> = {}
  ) {
    const optimized: OptimizedBudget[] = [];
    let totalCurrentRevenue = 0;
    let totalOptimizedRevenue = 0;
    const totalBudget = Object.values(currentBudgets).reduce((a, b) => a + b, 0);

    for (const [channel, forecast] of Object.entries(channelForecasts || {})) {
      const fc = forecast as any;
      const currentBudget = currentBudgets[channel] || 0;
      const currentRevenue = fc.p50_revenue || 0;
      const currentROAS = currentRevenue / Math.max(1, currentBudget);
      const constraint = constraints[channel] || this.defaultConstraint;

      let optimalBudget = currentBudget;
      let optimalRevenue = currentRevenue;

      if (currentROAS < constraint.minROAS) {
        optimalBudget = currentBudget * 0.7;
        optimalRevenue = currentRevenue * 0.85;
      } else if (currentROAS > constraint.targetROAS) {
        optimalBudget = Math.min(currentBudget * 1.3, constraint.maxBudget);
        optimalRevenue = currentRevenue * 1.15;
      }

      totalCurrentRevenue += currentRevenue;
      totalOptimizedRevenue += optimalRevenue;

      optimized.push({
        channel,
        currentBudget,
        optimizedBudget: Math.round(optimalBudget * 100) / 100,
        expectedRevenue: Math.round(optimalRevenue * 100) / 100,
        expectedROAS: Math.round((optimalRevenue / Math.max(1, optimalBudget)) * 100) / 100,
        adjustment: Math.round(((optimalBudget - currentBudget) / Math.max(1, currentBudget)) * 100),
      });
    }

    return {
      optimizedBudgets: optimized,
      totalRevenueIncrease: Math.round((totalOptimizedRevenue - totalCurrentRevenue) * 100) / 100,
      totalROASImprovement: Math.round(((totalOptimizedRevenue / totalBudget) - (totalCurrentRevenue / totalBudget)) * 100) / 100,
      recommendations: this.generateRecommendations(optimized),
    };
  }

  private generateRecommendations(optimized: OptimizedBudget[]): string[] {
    return optimized.map(opt => {
      if (opt.adjustment > 0) return `Increase ${opt.channel} by ${opt.adjustment}% - strong ROAS (${opt.expectedROAS.toFixed(2)}x)`;
      if (opt.adjustment < 0) return `Reduce ${opt.channel} by ${Math.abs(opt.adjustment)}% - below target ROAS (${opt.expectedROAS.toFixed(2)}x)`;
      return `${opt.channel} allocation is optimal`;
    });
  }

  calculateROASConfidenceInterval(revenue: number[], budget: number, confidenceLevel = 0.8) {
    const sorted = [...revenue].sort((a, b) => a - b);
    const lo = Math.floor(((1 - confidenceLevel) / 2) * sorted.length);
    const hi = Math.floor(((1 + confidenceLevel) / 2) * sorted.length);
    return {
      lower: sorted[lo] / Math.max(1, budget),
      upper: sorted[hi] / Math.max(1, budget),
      expected: revenue.reduce((a, b) => a + b, 0) / revenue.length / Math.max(1, budget),
    };
  }
}

export const roasOptimizer = new ROASOptimizer();
