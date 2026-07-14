export interface CreativeData {
  id: string;
  name: string;
  channel: string;
  dailyMetrics: Array<{
    date: string;
    impressions: number;
    clicks: number;
    conversions: number;
    spend: number;
    revenue: number;
  }>;
}

export interface FatigueResult {
  creatives: Array<{
    id: string;
    name: string;
    channel: string;
    fatigueScore: number;
    performanceTrend: 'increasing' | 'stable' | 'decreasing';
    recommendedAction: 'refresh' | 'pause' | 'maintain';
    daysUntilCritical: number;
    currentCTR: number;
    historicalCTR: number;
  }>;
  summary: {
    totalCreatives: number;
    atRiskCount: number;
    criticalCount: number;
    averageFatigueScore: number;
  };
}

export class CreativeFatigueDetectorService {
  detect(creatives: CreativeData[]): FatigueResult {
    if (!creatives || creatives.length === 0) {
      return {
        creatives: [],
        summary: { totalCreatives: 0, atRiskCount: 0, criticalCount: 0, averageFatigueScore: 0 },
      };
    }

    const results = creatives.map(c => this.analyzeCreative(c));

    const atRiskCount = results.filter(r => r.fatigueScore >= 40 && r.fatigueScore < 70).length;
    const criticalCount = results.filter(r => r.fatigueScore >= 70).length;
    const averageFatigueScore = results.reduce((sum, r) => sum + r.fatigueScore, 0) / results.length;

    return {
      creatives: results,
      summary: {
        totalCreatives: results.length,
        atRiskCount,
        criticalCount,
        averageFatigueScore: Math.round(averageFatigueScore * 100) / 100,
      },
    };
  }

  private analyzeCreative(creative: CreativeData): FatigueResult['creatives'][0] {
    const metrics = creative.dailyMetrics;
    if (metrics.length === 0) {
      return this.emptyCreativeResult(creative);
    }

    const sortedMetrics = [...metrics].sort((a, b) => a.date.localeCompare(b.date));

    const ctrs = sortedMetrics.map(m => m.impressions > 0 ? (m.clicks / m.impressions) * 100 : 0);
    const cvrs = sortedMetrics.map(m => m.clicks > 0 ? (m.conversions / m.clicks) * 100 : 0);
    const rpms = sortedMetrics.map(m => m.impressions > 0 ? (m.revenue / m.impressions) * 1000 : 0);

    const currentCTR = ctrs[ctrs.length - 1] || 0;
    const historicalCTR = ctrs.length > 0 ? ctrs.reduce((a, b) => a + b, 0) / ctrs.length : 0;

    const fatigueScore = this.computeFatigueScore(ctrs, cvrs, rpms, sortedMetrics);
    const performanceTrend = this.determineTrend(ctrs);
    const recommendedAction = this.determineAction(fatigueScore, performanceTrend);
    const daysUntilCritical = this.estimateDaysUntilCritical(fatigueScore, ctrs);

    return {
      id: creative.id,
      name: creative.name,
      channel: creative.channel,
      fatigueScore: Math.round(fatigueScore * 100) / 100,
      performanceTrend,
      recommendedAction,
      daysUntilCritical,
      currentCTR: Math.round(currentCTR * 100) / 100,
      historicalCTR: Math.round(historicalCTR * 100) / 100,
    };
  }

  private computeFatigueScore(
    ctrs: number[],
    cvrs: number[],
    rpms: number[],
    metrics: CreativeData['dailyMetrics']
  ): number {
    if (ctrs.length < 3) return 20;

    const n = ctrs.length;
    const third = Math.max(1, Math.floor(n / 3));

    const earlyCTR = ctrs.slice(0, third).reduce((a, b) => a + b, 0) / third;
    const recentCTR = ctrs.slice(-third).reduce((a, b) => a + b, 0) / third;
    const ctrDecline = earlyCTR > 0 ? ((earlyCTR - recentCTR) / earlyCTR) * 100 : 0;

    const earlyCVR = cvrs.slice(0, third).reduce((a, b) => a + b, 0) / third;
    const recentCVR = cvrs.slice(-third).reduce((a, b) => a + b, 0) / third;
    const cvrDecline = earlyCVR > 0 ? ((earlyCVR - recentCVR) / earlyCVR) * 100 : 0;

    const earlyRPM = rpms.slice(0, third).reduce((a, b) => a + b, 0) / third;
    const recentRPM = rpms.slice(-third).reduce((a, b) => a + b, 0) / third;
    const rpmDecline = earlyRPM > 0 ? ((earlyRPM - recentRPM) / earlyRPM) * 100 : 0;

    const variance = ctrs.reduce((sq, v) => sq + (v - (ctrs.reduce((a, b) => a + b, 0) / n)) ** 2, 0) / n;
    const ctrMean = ctrs.reduce((a, b) => a + b, 0) / n;
    const volatility = ctrMean > 0 ? Math.sqrt(variance) / ctrMean : 0;

    const recencyWeight = this.computeRecencyWeight(metrics);

    let score = 0;
    score += Math.min(35, ctrDecline * 1.2);
    score += Math.min(25, cvrDecline * 0.8);
    score += Math.min(25, rpmDecline * 0.6);
    score += Math.min(10, volatility * 20);
    score += recencyWeight * 5;

    return Math.max(0, Math.min(100, score));
  }

  private computeRecencyWeight(metrics: CreativeData['dailyMetrics']): number {
    if (metrics.length < 2) return 0;
    const sorted = [...metrics].sort((a, b) => a.date.localeCompare(b.date));
    const lastDate = new Date(sorted[sorted.length - 1].date);
    const firstDate = new Date(sorted[0].date);
    const totalDays = (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24);

    if (totalDays > 30) return 1;
    if (totalDays > 14) return 0.6;
    if (totalDays > 7) return 0.3;
    return 0.1;
  }

  private determineTrend(ctrs: number[]): 'increasing' | 'stable' | 'decreasing' {
    if (ctrs.length < 4) return 'stable';

    const n = ctrs.length;
    const half = Math.floor(n / 2);
    const firstHalf = ctrs.slice(0, half);
    const secondHalf = ctrs.slice(half);

    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    const changePercent = firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0;

    if (changePercent > 5) return 'increasing';
    if (changePercent < -5) return 'decreasing';
    return 'stable';
  }

  private determineAction(
    fatigueScore: number,
    trend: 'increasing' | 'stable' | 'decreasing'
  ): 'refresh' | 'pause' | 'maintain' {
    if (fatigueScore >= 70) return 'pause';
    if (fatigueScore >= 40 && trend === 'decreasing') return 'refresh';
    if (fatigueScore >= 40) return 'refresh';
    return 'maintain';
  }

  private estimateDaysUntilCritical(fatigueScore: number, ctrs: number[]): number {
    if (fatigueScore >= 70) return 0;
    if (ctrs.length < 3) return 30;

    const n = ctrs.length;
    const third = Math.max(1, Math.floor(n / 3));
    const earlyCTR = ctrs.slice(0, third).reduce((a, b) => a + b, 0) / third;
    const recentCTR = ctrs.slice(-third).reduce((a, b) => a + b, 0) / third;

    const dailyDeclineRate = earlyCTR > 0
      ? ((earlyCTR - recentCTR) / earlyCTR) / Math.max(1, n)
      : 0;

    if (dailyDeclineRate <= 0) return 60;

    const remainingScore = 70 - fatigueScore;
    const dailyScoreIncrease = dailyDeclineRate * 50;

    const days = dailyScoreIncrease > 0 ? Math.ceil(remainingScore / dailyScoreIncrease) : 60;
    return Math.min(60, Math.max(1, days));
  }

  private emptyCreativeResult(creative: CreativeData): FatigueResult['creatives'][0] {
    return {
      id: creative.id,
      name: creative.name,
      channel: creative.channel,
      fatigueScore: 0,
      performanceTrend: 'stable',
      recommendedAction: 'maintain',
      daysUntilCritical: 60,
      currentCTR: 0,
      historicalCTR: 0,
    };
  }
}

export const creativeFatigueDetectorService = new CreativeFatigueDetectorService();
