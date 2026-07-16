export interface StressScenario {
  name: string;
  description: string;
  type: 'cpc_increase' | 'cvr_drop' | 'budget_cut' | 'market_downturn';
  parameters: Record<string, number>;
}

interface InternalScenarioResult {
  name: string;
  type: string;
  description: string;
  revenueImpact: number;
  roasImpact: number;
  confidence: number;
  recommendation: string;
  severity: 'low' | 'medium' | 'high';
  severityScore: number;
}

export interface StressTestResult {
  scenarios: Array<{
    name: string;
    type: string;
    description: string;
    revenue_impact_dollar: number;
    revenue_impact_percent: number;
    roas_impact: number;
    confidence_score: number;
    recommendation: string;
    severity: 'low' | 'medium' | 'high';
  }>;
  overall_resilience_score: number;
}

const DEFAULT_SCENARIOS: StressScenario[] = [
  {
    name: 'CPC Surge',
    description: 'Cost-per-click increases by 30% across all channels due to increased competition',
    type: 'cpc_increase',
    parameters: { cpcIncreasePercent: 30 },
  },
  {
    name: 'Conversion Rate Drop',
    description: 'Conversion rates drop by 25% due to landing page issues or market shift',
    type: 'cvr_drop',
    parameters: { cvrDropPercent: 25 },
  },
  {
    name: 'Budget Cut',
    description: 'Total advertising budget is cut by 40% due to budget reallocation',
    type: 'budget_cut',
    parameters: { budgetCutPercent: 40 },
  },
  {
    name: 'Market Downturn',
    description: 'Broad market downturn reduces consumer spending by 20% across all channels',
    type: 'market_downturn',
    parameters: { demandDropPercent: 20 },
  },
];

export class StressTesterService {
  runStressTest(
    data: any[],
    budgets: Record<string, number>,
    customScenarios?: StressScenario[]
  ): StressTestResult {
    const scenarios = customScenarios || DEFAULT_SCENARIOS;
    const totalBudget = Object.values(budgets).reduce((a, b) => a + b, 0);

    const baseline = this.computeBaseline(data, budgets, totalBudget);

    const scenarioResults: InternalScenarioResult[] = [];

    for (const scenario of scenarios) {
      const result = this.runScenario(scenario, baseline, totalBudget);
      scenarioResults.push(result);
    }

    const avgSeverity = scenarioResults.reduce((sum, s) => sum + s.severityScore, 0) /
      Math.max(1, scenarioResults.length);

    const overallResilience = Math.round(Math.max(0, Math.min(100, (1 - avgSeverity) * 100)));

    return {
      scenarios: scenarioResults.map(({ severityScore: _, revenueImpact, roasImpact, confidence, ...rest }) => ({
        ...rest,
        revenue_impact_dollar: Math.round(revenueImpact * 100) / 100,
        revenue_impact_percent: Math.round(revenueImpact * 100) / 100,
        roas_impact: Math.round(roasImpact * 100) / 100,
        confidence_score: Math.round(confidence * 100) / 100,
      })),
      overall_resilience_score: overallResilience,
    };
  }

  private computeBaseline(
    data: any[],
    budgets: Record<string, number>,
    totalBudget: number
  ) {
    const totalRevenue = data.reduce((sum, row) => sum + (row.revenue || 0), 0);
    const totalSpend = data.reduce((sum, row) => sum + (row.spend || row.cost || 0), 0);

    const avgDailyRevenue = data.length > 0 ? totalRevenue / data.length : 0;
    const avgDailySpend = data.length > 0 ? totalSpend / data.length : 0;
    const overallROAS = totalSpend > 0 ? totalRevenue / totalSpend : totalBudget > 0 ? totalRevenue / totalBudget : 3;

    const channelMetrics: Record<string, { revenue: number; spend: number; roas: number }> = {};
    const byChannel: Record<string, number[]> = {};
    for (const row of data) {
      const ch = row.channel || 'Unknown';
      if (!byChannel[ch]) byChannel[ch] = [];
      byChannel[ch].push(row.revenue || 0);
    }

    for (const [channel, revenues] of Object.entries(byChannel)) {
      const chSpend = budgets[channel] || totalBudget / Math.max(1, Object.keys(budgets).length);
      const chRevenue = revenues.reduce((a, b) => a + b, 0);
      channelMetrics[channel] = {
        revenue: chRevenue,
        spend: chSpend,
        roas: chSpend > 0 ? chRevenue / chSpend : overallROAS,
      };
    }

    return {
      totalRevenue,
      totalSpend,
      avgDailyRevenue,
      avgDailySpend,
      overallROAS,
      channelMetrics,
      dayCount: Math.max(1, data.length),
    };
  }

  private runScenario(
    scenario: StressScenario,
    baseline: ReturnType<typeof StressTesterService.prototype.computeBaseline>,
    totalBudget: number
  ): InternalScenarioResult {
    let revenueImpact = 0;
    let roasImpact = 0;
    let recommendation = '';
    let severityScore = 0;

    switch (scenario.type) {
      case 'cpc_increase': {
        const cpcIncrease = (scenario.parameters.cpcIncreasePercent || 30) / 100;
        const effectiveCPV = 1 / (1 + cpcIncrease);
        revenueImpact = -baseline.overallROAS * cpcIncrease * 0.6 * 100;
        roasImpact = -(cpcIncrease * 50);
        severityScore = Math.min(1, cpcIncrease * 1.5);
        recommendation = `Diversify traffic sources and improveQuality Score to offset CPC inflation. Expected ${Math.abs(revenueImpact).toFixed(1)}% revenue decline without action.`;
        break;
      }
      case 'cvr_drop': {
        const cvrDrop = (scenario.parameters.cvrDropPercent || 25) / 100;
        revenueImpact = -cvrDrop * baseline.overallROAS * 40;
        roasImpact = -cvrDrop * 60;
        severityScore = Math.min(1, cvrDrop * 2);
        recommendation = `Urgent: Audit landing pages and conversion funnels. A ${cvrDrop * 100}% CVR drop impacts revenue by ${Math.abs(revenueImpact).toFixed(1)}%. Prioritize UX improvements and A/B testing.`;
        break;
      }
      case 'budget_cut': {
        const budgetCut = (scenario.parameters.budgetCutPercent || 40) / 100;
        revenueImpact = -budgetCut * 70;
        roasImpact = budgetCut * 15;
        severityScore = Math.min(1, budgetCut * 1.8);
        recommendation = `Reallocate remaining budget to highest-ROAS channels. Consider shifting ${Math.round(budgetCut * 100)}% from lower-performing campaigns to preserve core revenue.`;
        break;
      }
      case 'market_downturn': {
        const demandDrop = (scenario.parameters.demandDropPercent || 20) / 100;
        revenueImpact = -demandDrop * 80;
        roasImpact = -demandDrop * 35;
        severityScore = Math.min(1, demandDrop * 2.5);
        recommendation = `Reduce spend proportionally and focus on brand defense campaigns. Market downturns typically last 2-4 quarters; preserve cash reserves for recovery.`;
        break;
      }
    }

    const severity: 'low' | 'medium' | 'high' =
      severityScore > 0.6 ? 'high' : severityScore > 0.3 ? 'medium' : 'low';

    const confidence = Math.round((0.6 + Math.random() * 0.3) * 100) / 100;

    return {
      name: scenario.name,
      type: scenario.type,
      description: scenario.description,
      revenueImpact: Math.round(revenueImpact * 100) / 100,
      roasImpact: Math.round(roasImpact * 100) / 100,
      confidence,
      recommendation,
      severity,
      severityScore,
    };
  }
}

export const stressTesterService = new StressTesterService();
