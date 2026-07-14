export interface GoalPlanResult {
  targetRevenue: number;
  days: number;
  requiredBudgets: Record<string, number>;
  totalRequiredBudget: number;
  expectedROAS: number;
  confidenceScore: number;
  recommendations: Array<{
    channel: string;
    action: string;
    expectedImpact: string;
    priority: 'high' | 'medium' | 'low';
  }>;
}

interface ChannelEfficiency {
  roas: number;
  elasticity: number;
  confidence: number;
}

const DEFAULT_CHANNEL_EFFICIENCY: Record<string, ChannelEfficiency> = {
  'Google Ads': { roas: 4.5, elasticity: 0.7, confidence: 0.85 },
  'Meta Ads': { roas: 3.8, elasticity: 0.9, confidence: 0.8 },
  'Microsoft Ads': { roas: 3.2, elasticity: 0.6, confidence: 0.75 },
};

export class GoalPlannerService {
  planGoal(
    targetRevenue: number,
    days: number,
    currentBudgets: Record<string, number>,
    historicalData?: any[]
  ): GoalPlanResult {
    if (targetRevenue <= 0) {
      throw new Error('targetRevenue must be positive');
    }
    if (days <= 0) {
      throw new Error('days must be positive');
    }

    const channelEfficiency = this.buildChannelEfficiency(historicalData, currentBudgets);
    const channels = Object.keys(channelEfficiency);
    if (channels.length === 0) {
      return {
        targetRevenue,
        days,
        requiredBudgets: {},
        totalRequiredBudget: 0,
        expectedROAS: 0,
        confidenceScore: 0,
        recommendations: [],
      };
    }

    const totalCurrentBudget = Object.values(currentBudgets).reduce((a, b) => a + b, 0);
    const currentRevenueEstimate = this.estimateCurrentRevenue(currentBudgets, channelEfficiency);

    const dailyTarget = targetRevenue / days;
    const currentDailyRevenue = currentRevenueEstimate / Math.max(1, days);

    const requiredBudgets: Record<string, number> = {};
    let totalRequiredBudget = 0;

    for (const channel of channels) {
      const efficiency = channelEfficiency[channel];
      const currentBudget = currentBudgets[channel] || 0;
      const channelShare = totalCurrentBudget > 0 ? currentBudget / totalCurrentBudget : 1 / channels.length;

      const baseBudgetForTarget = targetRevenue / efficiency.roas;
      let channelBudget = baseBudgetForTarget * channelShare;

      const efficiencyFactor = efficiency.confidence * (1 + efficiency.elasticity * 0.15);
      channelBudget = channelBudget / efficiencyFactor;

      if (currentBudget > 0) {
        const budgetRatio = channelBudget / currentBudget;
        if (budgetRatio > 5) {
          channelBudget = currentBudget * 5;
        } else if (budgetRatio < 0.1) {
          channelBudget = currentBudget * 0.1;
        }
      }

      channelBudget = Math.max(0, Math.round(channelBudget * 100) / 100);
      requiredBudgets[channel] = channelBudget;
      totalRequiredBudget += channelBudget;
    }

    totalRequiredBudget = Math.round(totalRequiredBudget * 100) / 100;

    const expectedROAS = totalRequiredBudget > 0
      ? Math.round((targetRevenue / totalRequiredBudget) * 100) / 100
      : 0;

    const confidenceScore = this.computeConfidenceScore(channelEfficiency, currentBudgets, requiredBudgets, targetRevenue);

    const recommendations = this.generateRecommendations(channels, currentBudgets, requiredBudgets, channelEfficiency, targetRevenue);

    return {
      targetRevenue,
      days,
      requiredBudgets,
      totalRequiredBudget,
      expectedROAS,
      confidenceScore,
      recommendations,
    };
  }

  private buildChannelEfficiency(
    historicalData?: any[],
    currentBudgets?: Record<string, number>
  ): Record<string, ChannelEfficiency> {
    if (historicalData && historicalData.length > 0) {
      return this.computeEfficiencyFromData(historicalData, currentBudgets);
    }
    return { ...DEFAULT_CHANNEL_EFFICIENCY };
  }

  private computeEfficiencyFromData(
    data: any[],
    currentBudgets?: Record<string, number>
  ): Record<string, ChannelEfficiency> {
    const byChannel: Record<string, { revenue: number; spend: number; count: number }> = {};

    for (const row of data) {
      const channel = row.channel || 'Unknown';
      if (!byChannel[channel]) {
        byChannel[channel] = { revenue: 0, spend: 0, count: 0 };
      }
      byChannel[channel].revenue += row.revenue || 0;
      byChannel[channel].spend += row.spend || row.cost || 0;
      byChannel[channel].count += 1;
    }

    const efficiency: Record<string, ChannelEfficiency> = {};

    for (const [channel, stats] of Object.entries(byChannel)) {
      if (stats.count < 7) {
        const defaults = DEFAULT_CHANNEL_EFFICIENCY[channel];
        efficiency[channel] = defaults || { roas: 3.0, elasticity: 0.7, confidence: 0.6 };
        continue;
      }

      const roas = stats.spend > 0 ? stats.revenue / stats.spend : 3.0;

      const dailyRevenues = this.aggregateDaily(data, channel);
      const elasticity = this.estimateElasticity(dailyRevenues);

      const dataConfidence = Math.min(1, stats.count / 60);
      const roasConfidence = roas > 1 ? Math.min(1, roas / 5) : 0.3;
      const confidence = (dataConfidence * 0.6 + roasConfidence * 0.4);

      efficiency[channel] = {
        roas: Math.round(roas * 100) / 100,
        elasticity: Math.round(elasticity * 100) / 100,
        confidence: Math.round(confidence * 100) / 100,
      };
    }

    return efficiency;
  }

  private aggregateDaily(data: any[], channel: string): number[] {
    const dailyMap: Record<string, number> = {};
    for (const row of data) {
      if (row.channel !== channel) continue;
      const date = row.date || row.ds || '';
      dailyMap[date] = (dailyMap[date] || 0) + (row.revenue || 0);
    }
    return Object.values(dailyMap);
  }

  private estimateElasticity(values: number[]): number {
    if (values.length < 14) return 0.7;

    const n = values.length;
    const firstHalf = values.slice(0, Math.floor(n / 2));
    const secondHalf = values.slice(Math.floor(n / 2));

    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    const variance = values.reduce((sq, v) => sq + (v - firstAvg) ** 2, 0) / n;
    const cv = firstAvg > 0 ? Math.sqrt(variance) / firstAvg : 0.5;

    let trend = firstAvg > 0 ? (secondAvg - firstAvg) / firstAvg : 0;
    trend = Math.max(-1, Math.min(1, trend));

    let elasticity = 0.7 + trend * 0.2 + (cv - 0.3) * 0.1;
    elasticity = Math.max(0.3, Math.min(1.2, elasticity));

    return elasticity;
  }

  private estimateCurrentRevenue(
    currentBudgets: Record<string, number>,
    channelEfficiency: Record<string, ChannelEfficiency>
  ): number {
    let totalRevenue = 0;
    for (const [channel, budget] of Object.entries(currentBudgets)) {
      const efficiency = channelEfficiency[channel];
      if (efficiency) {
        totalRevenue += budget * efficiency.roas;
      }
    }
    return totalRevenue;
  }

  private computeConfidenceScore(
    channelEfficiency: Record<string, ChannelEfficiency>,
    currentBudgets: Record<string, number>,
    requiredBudgets: Record<string, number>,
    targetRevenue: number
  ): number {
    const totalRequired = Object.values(requiredBudgets).reduce((a, b) => a + b, 0);
    if (totalRequired === 0) return 0;

    const avgConfidence = Object.values(channelEfficiency).reduce((sum, e) => sum + e.confidence, 0) /
      Math.max(1, Object.keys(channelEfficiency).length);

    const currentTotal = Object.values(currentBudgets).reduce((a, b) => a + b, 0);
    let budgetStretchFactor = 1;
    if (currentTotal > 0) {
      const stretchRatio = totalRequired / currentTotal;
      if (stretchRatio > 1) {
        budgetStretchFactor = Math.max(0.5, 1 - (stretchRatio - 1) * 0.15);
      } else {
        budgetStretchFactor = Math.min(1.2, 1 + (1 - stretchRatio) * 0.1);
      }
    }

    const avgROAS = Object.values(channelEfficiency).reduce((sum, e) => sum + e.roas, 0) /
      Math.max(1, Object.keys(channelEfficiency).length);
    const roasFeasibility = Math.min(1, avgROAS / (targetRevenue / Math.max(1, totalRequired)));

    const score = avgConfidence * 0.4 + budgetStretchFactor * 0.3 + roasFeasibility * 0.3;
    return Math.round(Math.max(0, Math.min(1, score)) * 100) / 100;
  }

  private generateRecommendations(
    channels: string[],
    currentBudgets: Record<string, number>,
    requiredBudgets: Record<string, number>,
    channelEfficiency: Record<string, ChannelEfficiency>,
    targetRevenue: number
  ): GoalPlanResult['recommendations'] {
    const recommendations: GoalPlanResult['recommendations'] = [];

    for (const channel of channels) {
      const efficiency = channelEfficiency[channel];
      const currentBudget = currentBudgets[channel] || 0;
      const requiredBudget = requiredBudgets[channel] || 0;

      if (currentBudget === 0 && requiredBudget > 0) {
        recommendations.push({
          channel,
          action: `Allocate $${requiredBudget.toLocaleString()} to ${channel} to capture demand`,
          expectedImpact: `+$${Math.round(requiredBudget * efficiency.roas).toLocaleString()} revenue`,
          priority: 'high',
        });
        continue;
      }

      if (currentBudget === 0) continue;

      const changePercent = currentBudget > 0
        ? ((requiredBudget - currentBudget) / currentBudget) * 100
        : 0;

      if (changePercent > 25) {
        recommendations.push({
          channel,
          action: `Increase ${channel} budget by ${Math.round(changePercent)}% (from $${currentBudget.toLocaleString()} to $${requiredBudget.toLocaleString()})`,
          expectedImpact: `+$${Math.round((requiredBudget - currentBudget) * efficiency.roas * 0.8).toLocaleString()} incremental revenue`,
          priority: changePercent > 50 ? 'high' : 'medium',
        });
      } else if (changePercent < -25) {
        recommendations.push({
          channel,
          action: `Decrease ${channel} budget by ${Math.round(Math.abs(changePercent))}% to optimize ROAS`,
          expectedImpact: `Improve channel ROAS from ${efficiency.roas.toFixed(1)}x to higher efficiency`,
          priority: 'medium',
        });
      } else {
        recommendations.push({
          channel,
          action: `Maintain ${channel} budget at $${requiredBudget.toLocaleString()}`,
          expectedImpact: `On track for target with ${efficiency.roas.toFixed(1)}x ROAS`,
          priority: 'low',
        });
      }
    }

    const totalRequired = Object.values(requiredBudgets).reduce((a, b) => a + b, 0);
    const impliedROAS = totalRequired > 0 ? targetRevenue / totalRequired : 0;

    if (impliedROAS > 6) {
      recommendations.push({
        channel: 'Overall',
        action: 'Target ROAS is ambitious; consider incremental testing before full commitment',
        expectedImpact: 'Reduces risk of overspending on unproven targets',
        priority: 'medium',
      });
    }

    const lowConfidenceChannels = channels.filter(c => channelEfficiency[c].confidence < 0.5);
    for (const channel of lowConfidenceChannels) {
      recommendations.push({
        channel,
        action: `Limited historical data for ${channel}; start with conservative budget and scale`,
        expectedImpact: 'Improves confidence before committing full budget',
        priority: 'high',
      });
    }

    return recommendations;
  }
}

export const goalPlannerService = new GoalPlannerService();
