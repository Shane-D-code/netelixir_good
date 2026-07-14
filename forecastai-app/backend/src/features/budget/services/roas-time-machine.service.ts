export interface TimeMachineResult {
  budgets: Record<string, number>;
  projectedRevenue: number;
  projectedROAS: number;
  channelRevenues: Record<string, number>;
  improvementPercent: number;
}

export interface PresetScenario {
  name: string;
  description: string;
  budgets: Record<string, number>;
}

function channelROAS(channel: string, data: any[]): number {
  const channelData = data.filter(d => d.channel === channel);
  if (channelData.length === 0) return 1.0;

  const totalRevenue = channelData.reduce((sum, d) => sum + (d.revenue || 0), 0);
  const totalSpend = channelData.reduce((sum, d) => sum + (d.spend || 0), 0);

  if (totalSpend <= 0) return 1.0;
  const roas = totalRevenue / totalSpend;

  return Math.max(0.1, Math.min(12, roas));
}

function diminishingReturns(roas: number, currentSpend: number, newSpend: number): number {
  if (newSpend <= 0) return 0;
  const ratio = newSpend / Math.max(currentSpend, 1);
  const elasticity = Math.log(1 + ratio) / Math.log(2);
  const baseRevenue = newSpend * roas;
  return baseRevenue * Math.min(1.0, elasticity);
}

function baselineTotalSpend(data: any[]): Record<string, number> {
  const spend: Record<string, number> = {};
  for (const row of data) {
    if (!spend[row.channel]) spend[row.channel] = 0;
    spend[row.channel] += row.spend || 0;
  }
  return spend;
}

export class RoasTimeMachineService {
  recalculate(budgets: Record<string, number>, data: any[]): TimeMachineResult {
    const baselineSpend = baselineTotalSpend(data);
    const channelRevenues: Record<string, number> = {};
    let projectedRevenue = 0;

    for (const [channel, budget] of Object.entries(budgets)) {
      const roas = channelROAS(channel, data);
      const currentSpend = baselineSpend[channel] || budget;
      const revenue = diminishingReturns(roas, currentSpend, budget);
      channelRevenues[channel] = Math.round(revenue * 100) / 100;
      projectedRevenue += revenue;
    }

    const totalSpend = Object.values(budgets).reduce((a, b) => a + b, 0);
    const projectedROAS = totalSpend > 0 ? projectedRevenue / totalSpend : 0;

    const baselineRevenue = data.reduce((sum, d) => sum + (d.revenue || 0), 0);
    const improvementPercent = baselineRevenue > 0
      ? ((projectedRevenue - baselineRevenue) / baselineRevenue) * 100
      : 0;

    return {
      budgets,
      projectedRevenue: Math.round(projectedRevenue * 100) / 100,
      projectedROAS: Math.round(projectedROAS * 100) / 100,
      channelRevenues,
      improvementPercent: Math.round(improvementPercent * 100) / 100,
    };
  }

  getPresetScenarios(): PresetScenario[] {
    return [
      {
        name: 'Aggressive Meta',
        description: 'Shifts 60% of budget to Meta for maximum reach; high risk, high reward',
        budgets: { meta: 5000, google: 1500, tiktok: 1000, microsoft: 500 },
      },
      {
        name: 'Balanced',
        description: 'Even distribution across all channels for diversified risk',
        budgets: { meta: 2000, google: 2000, tiktok: 1500, microsoft: 1500 },
      },
      {
        name: 'Conservative',
        description: 'Prioritizes proven performers (Google); lower risk, steady returns',
        budgets: { meta: 1200, google: 3500, tiktok: 800, microsoft: 1500 },
      },
      {
        name: 'Optimal',
        description: 'Data-driven allocation based on channel ROAS and marginal returns',
        budgets: { meta: 3200, google: 2800, tiktok: 1800, microsoft: 1200 },
      },
    ];
  }

  findOptimal(data: any[], totalBudget: number): TimeMachineResult {
    const channels = Array.from(new Set(data.map(d => d.channel)));
    if (channels.length === 0) {
      return {
        budgets: {},
        projectedRevenue: 0,
        projectedROAS: 0,
        channelRevenues: {},
        improvementPercent: 0,
      };
    }

    const channelScores = channels.map(ch => ({
      channel: ch,
      roas: channelROAS(ch, data),
    }));

    channelScores.sort((a, b) => b.roas - a.roas);

    const totalScore = channelScores.reduce((sum, c) => sum + c.roas, 0);
    const budgets: Record<string, number> = {};

    for (const { channel, roas } of channelScores) {
      const share = totalScore > 0 ? roas / totalScore : 1 / channels.length;
      budgets[channel] = Math.round(totalBudget * share * 100) / 100;
    }

    const allocated = Object.values(budgets).reduce((a, b) => a + b, 0);
    const remainder = Math.round((totalBudget - allocated) * 100) / 100;
    if (remainder !== 0 && channelScores.length > 0) {
      budgets[channelScores[0].channel] += remainder;
    }

    return this.recalculate(budgets, data);
  }
}

export const roasTimeMachine = new RoasTimeMachineService();
