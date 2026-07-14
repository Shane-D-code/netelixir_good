export interface MarketShockResult {
  shockType: string;
  severity: string;
  revenueImpact: number;
  roasImpact: number;
  recoveryTime: number;
  recommendations: string[];
  impactGauge: number;
  recoveryTimeline: Array<{ day: number; recoveryPercent: number }>;
}

interface ShockProfile {
  baseRevenueImpact: Record<string, number>;
  baseROASImpact: Record<string, number>;
  baseRecoveryDays: Record<string, number>;
  baseRecommendations: string[];
}

const SHOCK_PROFILES: Record<string, ShockProfile> = {
  competitor_sale: {
    baseRevenueImpact: { low: -8, medium: -18, high: -30 },
    baseROASImpact: { low: -5, medium: -12, high: -22 },
    baseRecoveryDays: { low: 7, medium: 14, high: 30 },
    baseRecommendations: [
      'Increase branded search spend to protect brand terms',
      'Consider temporary counter-promotion or value-add offers',
      'Monitor competitor pricing daily during the sale period',
      'Shift budget toward bottom-funnel campaigns with higher conversion rates',
    ],
  },
  algorithm_update: {
    baseRevenueImpact: { low: -5, medium: -15, high: -35 },
    baseROASImpact: { low: -3, medium: -10, high: -25 },
    baseRecoveryDays: { low: 10, medium: 21, high: 45 },
    baseRecommendations: [
      'Audit all campaigns for compliance with new algorithm guidelines',
      'Diversify traffic sources to reduce platform dependency',
      'Increase content quality scores and relevance metrics',
      'Test new ad formats and targeting strategies quickly',
    ],
  },
  supply_chain: {
    baseRevenueImpact: { low: -10, medium: -22, high: -40 },
    baseROASImpact: { low: -6, medium: -15, high: -30 },
    baseRecoveryDays: { low: 14, medium: 30, high: 60 },
    baseRecommendations: [
      'Reduce spend on out-of-stock products immediately',
      'Shift budget to available inventory and substitutes',
      'Communicate transparently with customers about availability',
      'Prepare demand capture plan for when supply normalizes',
    ],
  },
  economic_downturn: {
    baseRevenueImpact: { low: -12, medium: -25, high: -45 },
    baseROASImpact: { low: -8, medium: -18, high: -35 },
    baseRecoveryDays: { low: 21, medium: 45, high: 90 },
    baseRecommendations: [
      'Focus on retention and loyalty campaigns over acquisition',
      'Emphasize value messaging and promotions in ad copy',
      'Consolidate spend to highest-performing channels',
      'Build cash reserves by reducing experimental campaigns',
    ],
  },
};

export class MarketShockSimulatorService {
  simulate(
    shockType: string,
    severity: string,
    currentData: any[],
    budgets: Record<string, number>
  ): MarketShockResult {
    this.validateInputs(shockType, severity);

    const profile = SHOCK_PROFILES[shockType];
    const normalizedSeverity = severity.toLowerCase();

    const baseline = this.computeBaseline(currentData, budgets);

    const revenueImpact = profile.baseRevenueImpact[normalizedSeverity] || -20;
    const roasImpact = profile.baseROASImpact[normalizedSeverity] || -12;
    const recoveryDays = profile.baseRecoveryDays[normalizedSeverity] || 21;

    const adjustedRevenueImpact = this.adjustForBaseline(revenueImpact, baseline);
    const adjustedROASImpact = this.adjustForROAS(roasImpact, baseline);

    const impactGauge = this.computeImpactGauge(adjustedRevenueImpact, adjustedROASImpact);
    const recoveryTimeline = this.buildRecoveryTimeline(recoveryDays, adjustedRevenueImpact);

    const recommendations = this.generateRecommendations(
      shockType,
      normalizedSeverity,
      baseline,
      profile.baseRecommendations
    );

    return {
      shockType,
      severity: normalizedSeverity,
      revenueImpact: Math.round(adjustedRevenueImpact * 100) / 100,
      roasImpact: Math.round(adjustedROASImpact * 100) / 100,
      recoveryTime: recoveryDays,
      recommendations,
      impactGauge: Math.round(impactGauge * 100) / 100,
      recoveryTimeline,
    };
  }

  private validateInputs(shockType: string, severity: string): void {
    if (!SHOCK_PROFILES[shockType]) {
      throw new Error(`Unknown shock type: ${shockType}. Valid types: ${Object.keys(SHOCK_PROFILES).join(', ')}`);
    }
    const validSeverities = ['low', 'medium', 'high'];
    if (!validSeverities.includes(severity.toLowerCase())) {
      throw new Error(`Invalid severity: ${severity}. Must be low, medium, or high`);
    }
  }

  private computeBaseline(data: any[], budgets: Record<string, number>) {
    const totalRevenue = data.reduce((sum, row) => sum + (row.revenue || 0), 0);
    const totalSpend = data.reduce((sum, row) => sum + (row.spend || row.cost || 0), 0);
    const dayCount = Math.max(1, data.length);

    const avgDailyRevenue = totalRevenue / dayCount;
    const overallROAS = totalSpend > 0 ? totalRevenue / totalSpend : 3;
    const totalBudget = Object.values(budgets).reduce((a, b) => a + b, 0);

    const channelDistribution: Record<string, number> = {};
    for (const [channel, budget] of Object.entries(budgets)) {
      channelDistribution[channel] = totalBudget > 0 ? budget / totalBudget : 1 / Math.max(1, Object.keys(budgets).length);
    }

    return {
      totalRevenue,
      totalSpend,
      avgDailyRevenue,
      overallROAS,
      totalBudget,
      channelDistribution,
      dayCount,
    };
  }

  private adjustForBaseline(baseImpact: number, baseline: ReturnType<typeof MarketShockSimulatorService.prototype.computeBaseline>): number {
    let adjustment = 1;

    if (baseline.overallROAS < 2) {
      adjustment *= 1.15;
    } else if (baseline.overallROAS > 5) {
      adjustment *= 0.85;
    }

    if (baseline.dayCount < 30) {
      adjustment *= 0.9;
    } else if (baseline.dayCount > 90) {
      adjustment *= 1.05;
    }

    return baseImpact * adjustment;
  }

  private adjustForROAS(baseImpact: number, baseline: ReturnType<typeof MarketShockSimulatorService.prototype.computeBaseline>): number {
    let adjustment = 1;

    if (baseline.overallROAS > 4) {
      adjustment *= 0.9;
    } else if (baseline.overallROAS < 2) {
      adjustment *= 1.1;
    }

    return baseImpact * adjustment;
  }

  private computeImpactGauge(revenueImpact: number, roasImpact: number): number {
    const absRevenue = Math.abs(revenueImpact);
    const absROAS = Math.abs(roasImpact);

    const gauge = (absRevenue * 0.6 + absROAS * 0.4);
    return Math.min(100, Math.max(0, gauge * 1.5));
  }

  private buildRecoveryTimeline(recoveryDays: number, initialImpact: number): MarketShockResult['recoveryTimeline'] {
    const timeline: MarketShockResult['recoveryTimeline'] = [];
    const steps = Math.min(10, recoveryDays);
    const dayInterval = Math.max(1, Math.floor(recoveryDays / steps));

    for (let i = 0; i <= steps; i++) {
      const day = i * dayInterval;
      const progress = i / steps;
      const recoveryPercent = Math.round((1 - Math.pow(1 - progress, 1.5)) * 100 * 100) / 100;

      timeline.push({ day, recoveryPercent: Math.min(100, recoveryPercent) });
    }

    if (timeline[timeline.length - 1].day !== recoveryDays) {
      timeline.push({ day: recoveryDays, recoveryPercent: 100 });
    }

    return timeline;
  }

  private generateRecommendations(
    shockType: string,
    severity: string,
    baseline: ReturnType<typeof MarketShockSimulatorService.prototype.computeBaseline>,
    baseRecommendations: string[]
  ): string[] {
    const recommendations = [...baseRecommendations];

    if (severity === 'high') {
      recommendations.push(
        `URGENT: Activate crisis budget protocol — reduce non-essential spend by ${Math.round(30 + Math.random() * 20)}%`
      );
      recommendations.push(
        'Schedule daily standup to monitor KPIs during recovery period'
      );
    }

    if (baseline.overallROAS < 2.5) {
      recommendations.push(
        'Current ROAS is already below healthy threshold; prioritize profitability over growth during shock'
      );
    }

    const channelCount = Object.keys(baseline.channelDistribution).length;
    if (channelCount <= 2) {
      recommendations.push(
        `Only ${channelCount} active channel(s) — diversification is critical to reduce future shock vulnerability`
      );
    }

    if (shockType === 'competitor_sale' && severity !== 'low') {
      recommendations.push(
        `Consider temporary budget increase of ${severity === 'high' ? '15-20' : '8-12'}% to defend market share`
      );
    }

    return recommendations;
  }
}

export const marketShockSimulatorService = new MarketShockSimulatorService();
