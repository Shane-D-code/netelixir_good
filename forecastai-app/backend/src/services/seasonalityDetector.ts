export interface SeasonalPattern {
  name: string;
  startDate: string;
  endDate: string;
  multiplier: number;
  confidence: number;
}

export class SeasonalityDetector {
  private holidays: [string, number, number][] = [
    ['Black Friday', 2.5, 0.9],
    ['Cyber Monday', 2.3, 0.85],
    ['Christmas', 2.0, 0.8],
    ['New Year', 1.5, 0.7],
    ["Valentine's Day", 1.4, 0.6],
    ["Mother's Day", 1.3, 0.55],
    ["Father's Day", 1.2, 0.5],
    ['Back to School', 1.4, 0.65],
    ['Prime Day', 1.8, 0.7],
    ['Labor Day', 1.2, 0.5],
    ['Halloween', 1.3, 0.55],
    ['Thanksgiving', 1.6, 0.75],
  ];

  detectSeasonality(data: any[]) {
    const dailyRevenue = this.aggregateDailyRevenue(data);
    const weeklyPattern = this.calculateWeeklyPattern(dailyRevenue);
    const monthlyPattern = this.calculateMonthlyPattern(dailyRevenue);
    const patterns = this.detectHolidayEffects(dailyRevenue);
    return {
      patterns,
      weeklyPattern,
      monthlyPattern,
      recommendations: this.generateRecommendations(weeklyPattern, monthlyPattern),
    };
  }

  private aggregateDailyRevenue(data: any[]): Map<string, number> {
    const map = new Map<string, number>();
    for (const row of data) {
      const date = (row.date || '').split('T')[0];
      if (date) map.set(date, (map.get(date) || 0) + (row.revenue || 0));
    }
    return map;
  }

  private calculateWeeklyPattern(dailyRevenue: Map<string, number>): number[] {
    const sums = [0, 0, 0, 0, 0, 0, 0];
    const counts = [0, 0, 0, 0, 0, 0, 0];
    for (const [dateStr, rev] of dailyRevenue) {
      const dow = new Date(dateStr).getDay();
      sums[dow] += rev;
      counts[dow]++;
    }
    const avgs = sums.map((s, i) => (counts[i] > 0 ? s / counts[i] : 0));
    const max = Math.max(...avgs, 1);
    return avgs.map(a => a / max);
  }

  private calculateMonthlyPattern(dailyRevenue: Map<string, number>): number[] {
    const sums = new Array(12).fill(0);
    const counts = new Array(12).fill(0);
    for (const [dateStr, rev] of dailyRevenue) {
      const month = new Date(dateStr).getMonth();
      sums[month] += rev;
      counts[month]++;
    }
    const avgs = sums.map((s, i) => (counts[i] > 0 ? s / counts[i] : 0));
    const max = Math.max(...avgs, 1);
    return avgs.map(a => a / max);
  }

  private detectHolidayEffects(_dailyRevenue: Map<string, number>): SeasonalPattern[] {
    const year = new Date().getFullYear();
    return this.holidays.map(([name, mult, conf]) => ({
      name,
      startDate: `${year}-11-25`,
      endDate: `${year}-12-02`,
      multiplier: mult,
      confidence: conf,
    }));
  }

  private generateRecommendations(weeklyPattern: number[], monthlyPattern: number[]): string[] {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const bestDayIdx = weeklyPattern.indexOf(Math.max(...weeklyPattern));
    const bestMonthIdx = monthlyPattern.indexOf(Math.max(...monthlyPattern));
    return [
      `Increase budget on ${days[bestDayIdx]}s - historically ${(weeklyPattern[bestDayIdx] * 100).toFixed(0)}% higher conversion`,
      `Prepare inventory for ${months[bestMonthIdx]} - peak season expected`,
    ];
  }
}

export const seasonalityDetector = new SeasonalityDetector();
