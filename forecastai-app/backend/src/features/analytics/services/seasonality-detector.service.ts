export interface SeasonalPattern {
  name: string;
  startDate: string;
  endDate: string;
  multiplier: number;
  confidence: number;
}

export class SeasonalityDetector {
  private static readonly US_HOLIDAYS: Array<{ name: string; month: number; day: number; multiplier: number }> = [
    { name: "New Year's Day", month: 0, day: 1, multiplier: 1.5 },
    { name: 'Martin Luther King Jr. Day', month: 0, day: 0, multiplier: 1.0 },
    { name: "Valentine's Day", month: 1, day: 14, multiplier: 1.4 },
    { name: "Presidents' Day", month: 1, day: 0, multiplier: 1.0 },
    { name: "Mother's Day", month: 4, day: 0, multiplier: 1.3 },
    { name: 'Memorial Day', month: 4, day: 0, multiplier: 1.2 },
    { name: "Father's Day", month: 5, day: 0, multiplier: 1.2 },
    { name: 'Independence Day', month: 6, day: 4, multiplier: 1.3 },
    { name: 'Labor Day', month: 8, day: 0, multiplier: 1.2 },
    { name: 'Halloween', month: 9, day: 31, multiplier: 1.3 },
    { name: 'Veterans Day', month: 10, day: 11, multiplier: 1.0 },
    { name: 'Black Friday', month: 10, day: 0, multiplier: 2.5 },
    { name: 'Cyber Monday', month: 10, day: 0, multiplier: 2.3 },
    { name: 'Christmas Eve', month: 11, day: 24, multiplier: 1.8 },
    { name: 'Christmas Day', month: 11, day: 25, multiplier: 2.0 },
    { name: "New Year's Eve", month: 11, day: 31, multiplier: 1.5 },
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

  private detectHolidayEffects(dailyRevenue: Map<string, number>): SeasonalPattern[] {
    const year = new Date().getFullYear();
    return SeasonalityDetector.US_HOLIDAYS.map(holiday => {
      let dateStr: string;
      if (holiday.day === 0) {
        dateStr = this.getNthWeekdayOfMonth(year, holiday.month, 1).toISOString().split('T')[0];
      } else {
        dateStr = `${year}-${String(holiday.month + 1).padStart(2, '0')}-${String(holiday.day).padStart(2, '0')}`;
      }

      const weekBefore = this.getWeekRevenue(dailyRevenue, dateStr, -7);
      const holidayWeek = this.getWeekRevenue(dailyRevenue, dateStr, 0);
      const multiplier = weekBefore > 0 ? holidayWeek / weekBefore : holiday.multiplier;
      const confidence = holidayWeek > 0 ? Math.min(0.95, 0.5 + (holidayWeek / Math.max(1, weekBefore)) * 0.1) : 0.3;

      return {
        name: holiday.name,
        startDate: dateStr,
        endDate: dateStr,
        multiplier: Math.round(multiplier * 100) / 100,
        confidence: Math.round(confidence * 100) / 100,
      };
    });
  }

  private getWeekRevenue(dailyRevenue: Map<string, number>, refDate: string, offsetDays: number): number {
    const ref = new Date(refDate);
    let total = 0;
    for (let i = offsetDays; i < offsetDays + 7; i++) {
      const d = new Date(ref);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().split('T')[0];
      total += dailyRevenue.get(key) || 0;
    }
    return total;
  }

  private getNthWeekdayOfMonth(year: number, month: number, nth: number): Date {
    const d = new Date(year, month, 1);
    let count = 0;
    while (count < nth) {
      if (d.getDay() !== 0 || count > 0) {
        count++;
      }
      if (count < nth) d.setDate(d.getDate() + 1);
    }
    return d;
  }

  private generateRecommendations(weeklyPattern: number[], monthlyPattern: number[]): string[] {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const bestDayIdx = weeklyPattern.indexOf(Math.max(...weeklyPattern));
    const bestMonthIdx = monthlyPattern.indexOf(Math.max(...monthlyPattern));

    const recs: string[] = [];
    recs.push(`Increase budget on ${days[bestDayIdx]}s - historically ${(weeklyPattern[bestDayIdx] * 100).toFixed(0)}% higher conversion`);
    recs.push(`Prepare inventory for ${months[bestMonthIdx]} - peak season expected`);

    const upcoming = this.getUpcomingHolidayNames(30);
    if (upcoming.length > 0) {
      recs.push(`Upcoming holidays in 30 days: ${upcoming.join(', ')} - consider promotional campaigns`);
    }

    return recs;
  }

  getUpcomingHolidayNames(days: number = 30): string[] {
    const today = new Date();
    const upcoming: string[] = [];

    for (let i = 1; i <= days; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      const month = d.getMonth();
      const day = d.getDate();

      for (const holiday of SeasonalityDetector.US_HOLIDAYS) {
        if (holiday.month === month && (holiday.day === day || (holiday.day === 0 && d.getDay() === 1 && day <= 7))) {
          if (!upcoming.includes(holiday.name)) {
            upcoming.push(holiday.name);
          }
        }
      }
    }

    return upcoming;
  }
}

export const seasonalityDetector = new SeasonalityDetector();
