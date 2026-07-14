export interface PromotionParams {
  discountPercent: number;
  currentRevenue: number;
  currentAOV: number;
  profitMargin: number;
  elasticity: number;
}

export interface PromotionResult {
  estimatedRevenue: number;
  estimatedAOV: number;
  estimatedProfit: number;
  estimatedROAS: number;
  volumeIncrease: number;
  marginImpact: number;
  recommendation: string;
  beforeAfter: Array<{ revenue: number; aov: number; profit: number; roas: number }>;
}

export class PromotionSimulatorService {
  simulate(params: PromotionParams): PromotionResult {
    const { discountPercent, currentRevenue, currentAOV, profitMargin, elasticity } = params;

    this.validateParams(params);

    const discountFactor = discountPercent / 100;
    const currentUnits = currentAOV > 0 ? currentRevenue / currentAOV : 0;
    const currentProfit = currentRevenue * profitMargin;
    const currentSpend = currentRevenue > 0 ? currentRevenue / 4.0 : 0;
    const currentROAS = currentSpend > 0 ? currentRevenue / currentSpend : 0;

    const priceChangePercent = -discountPercent;
    const quantityChangePercent = Math.abs(priceChangePercent) * elasticity;
    const volumeMultiplier = 1 + quantityChangePercent / 100;

    const newAOV = currentAOV * (1 - discountFactor);
    const newUnits = currentUnits * volumeMultiplier;
    const estimatedRevenue = newUnits * newAOV;

    const estimatedProfit = estimatedRevenue * (profitMargin - discountFactor * (1 - profitMargin));
    const estimatedROAS = currentSpend > 0 ? estimatedRevenue / currentSpend : 0;

    const volumeIncrease = ((newUnits - currentUnits) / Math.max(1, currentUnits)) * 100;
    const marginImpact = ((estimatedProfit - currentProfit) / Math.max(1, Math.abs(currentProfit))) * 100;

    const recommendation = this.generateRecommendation({
      discountPercent,
      volumeIncrease,
      marginImpact,
      estimatedProfit,
      currentProfit,
      elasticity,
      estimatedROAS,
      currentROAS,
    });

    const beforeAfter = [
      {
        revenue: Math.round(currentRevenue * 100) / 100,
        aov: Math.round(currentAOV * 100) / 100,
        profit: Math.round(currentProfit * 100) / 100,
        roas: Math.round(currentROAS * 100) / 100,
      },
      {
        revenue: Math.round(estimatedRevenue * 100) / 100,
        aov: Math.round(newAOV * 100) / 100,
        profit: Math.round(estimatedProfit * 100) / 100,
        roas: Math.round(estimatedROAS * 100) / 100,
      },
    ];

    return {
      estimatedRevenue: Math.round(estimatedRevenue * 100) / 100,
      estimatedAOV: Math.round(newAOV * 100) / 100,
      estimatedProfit: Math.round(estimatedProfit * 100) / 100,
      estimatedROAS: Math.round(estimatedROAS * 100) / 100,
      volumeIncrease: Math.round(volumeIncrease * 100) / 100,
      marginImpact: Math.round(marginImpact * 100) / 100,
      recommendation,
      beforeAfter,
    };
  }

  private validateParams(params: PromotionParams): void {
    if (params.discountPercent < 0 || params.discountPercent > 90) {
      throw new Error('discountPercent must be between 0 and 90');
    }
    if (params.currentRevenue < 0) {
      throw new Error('currentRevenue must be non-negative');
    }
    if (params.currentAOV < 0) {
      throw new Error('currentAOV must be non-negative');
    }
    if (params.profitMargin < 0 || params.profitMargin > 1) {
      throw new Error('profitMargin must be between 0 and 1');
    }
    if (params.elasticity < 0.5 || params.elasticity > 5) {
      throw new Error('elasticity must be between 0.5 and 5');
    }
  }

  private generateRecommendation(data: {
    discountPercent: number;
    volumeIncrease: number;
    marginImpact: number;
    estimatedProfit: number;
    currentProfit: number;
    elasticity: number;
    estimatedROAS: number;
    currentROAS: number;
  }): string {
    const { discountPercent, volumeIncrease, marginImpact, estimatedProfit, currentProfit, elasticity, estimatedROAS } = data;

    const profitDelta = estimatedProfit - currentProfit;
    const revenueGainFromVolume = volumeIncrease > 0;

    if (profitDelta > 0 && revenueGainFromVolume) {
      if (profitDelta / Math.max(1, Math.abs(currentProfit)) > 0.1) {
        return `Strong promotion opportunity: ${discountPercent}% discount drives ${volumeIncrease.toFixed(0)}% volume increase with ${marginImpact > 0 ? '+' : ''}${marginImpact.toFixed(1)}% profit impact. Recommend proceeding.`;
      }
      return `Moderate opportunity: ${discountPercent}% discount increases volume by ${volumeIncrease.toFixed(0)}% with marginal profit gain of $${Math.round(profitDelta).toLocaleString()}. Consider testing.`;
    }

    if (profitDelta < 0 && revenueGainFromVolume) {
      return `Volume-driven promotion: ${discountPercent}% discount increases volume ${volumeIncrease.toFixed(0)}% but erodes profit by $${Math.abs(Math.round(profitDelta)).toLocaleString()}. Only recommended if customer acquisition is the primary goal.`;
    }

    if (!revenueGainFromVolume) {
      return `Not recommended: ${discountPercent}% discount with ${elasticity.toFixed(1)}x elasticity does not generate sufficient volume increase to offset margin loss.`;
    }

    return `Caution: This promotion configuration may not yield positive returns. Consider a smaller discount (${Math.max(5, discountPercent - 10)}%) to test response.`;
  }
}

export const promotionSimulatorService = new PromotionSimulatorService();
