import { v4 as uuidv4 } from 'uuid';
import { saveAlerts, getAllAlerts, acknowledgeAlertById, acknowledgeAllAlerts as dbAcknowledgeAll, getUnreadAlertCount } from '../../../core/database';

export interface Alert {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'warning' | 'info';
  channel: string;
  category: string;
  rootCause: string;
  suggestedAction: string;
  createdAt: string;
  acknowledged: boolean;
}

export interface AlertFilters {
  severity?: string;
  channel?: string;
  startDate?: string;
  endDate?: string;
}

const SEVERITY_WEIGHTS: Record<string, number> = { critical: 3, warning: 2, info: 1 };

function avg(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function stdDev(arr: number[]): number {
  const m = avg(arr);
  return Math.sqrt(arr.reduce((sq, v) => sq + (v - m) ** 2, 0) / arr.length);
}

function trendDirection(arr: number[]): number {
  if (arr.length < 4) return 0;
  const half = Math.floor(arr.length / 2);
  const first = avg(arr.slice(0, half));
  const second = avg(arr.slice(half));
  return first > 0 ? (second - first) / first : 0;
}

function detectSpike(arr: number[]): boolean {
  if (arr.length < 3) return false;
  const recent = arr[arr.length - 1];
  const historical = arr.slice(0, -1);
  const m = avg(historical);
  const s = stdDev(historical);
  return s > 0 && recent > m + 2 * s;
}

function detectDip(arr: number[]): boolean {
  if (arr.length < 3) return false;
  const recent = arr[arr.length - 1];
  const historical = arr.slice(0, -1);
  const m = avg(historical);
  const s = stdDev(historical);
  return s > 0 && recent < m - 2 * s;
}

export class AlertIntelligenceService {
  async generateAlerts(data: any[], forecastResult: any): Promise<Alert[]> {
    const newAlerts: Alert[] = [];
    const now = new Date().toISOString();

    const byChannel: Record<string, number[]> = {};
    const spendByChannel: Record<string, number[]> = {};

    for (const row of data) {
      if (!byChannel[row.channel]) {
        byChannel[row.channel] = [];
        spendByChannel[row.channel] = [];
      }
      byChannel[row.channel].push(row.revenue || 0);
      spendByChannel[row.channel].push(row.spend || row.impressions || 0);
    }

    for (const [channel, revenues] of Object.entries(byChannel)) {
      const spend = spendByChannel[channel];
      const totalRevenue = revenues.reduce((a, b) => a + b, 0);
      const totalSpend = spend.reduce((a, b) => a + b, 0);
      const roas = totalSpend > 0 ? totalRevenue / totalSpend : 0;
      const trend = trendDirection(revenues);
      const variance = stdDev(revenues);

      if (detectSpike(revenues)) {
        newAlerts.push({
          id: uuidv4(),
          title: `Revenue spike detected on ${channel}`,
          description: `Revenue surged ${(((revenues[revenues.length - 1] - avg(revenues.slice(0, -1))) / avg(revenues.slice(0, -1))) * 100).toFixed(1)}% above the historical average for ${channel}.`,
          severity: 'info',
          channel,
          category: 'anomaly',
          rootCause: 'Unusual demand spike, possible campaign virality or external event',
          suggestedAction: 'Increase budget temporarily to capitalize; monitor for sustainability',
          createdAt: now,
          acknowledged: false,
        });
      }

      if (detectDip(revenues)) {
        newAlerts.push({
          id: uuidv4(),
          title: `Revenue dip detected on ${channel}`,
          description: `Revenue dropped ${(((avg(revenues.slice(0, -1)) - revenues[revenues.length - 1]) / avg(revenues.slice(0, -1))) * 100).toFixed(1)}% below the historical average for ${channel}.`,
          severity: 'warning',
          channel,
          category: 'anomaly',
          rootCause: 'Possible ad fatigue, budget exhaustion, or platform issue',
          suggestedAction: 'Check campaign status, refresh creatives, verify tracking pixels',
          createdAt: now,
          acknowledged: false,
        });
      }

      if (trend < -0.15) {
        newAlerts.push({
          id: uuidv4(),
          title: `Declining trend on ${channel}`,
          description: `${channel} revenue trending down ${(Math.abs(trend) * 100).toFixed(1)}% over the analyzed period.`,
          severity: 'warning',
          channel,
          category: 'trend',
          rootCause: 'Sustained performance decline may indicate market shift or increased competition',
          suggestedAction: 'Review targeting, refresh creatives, consider reallocating budget to stronger channels',
          createdAt: now,
          acknowledged: false,
        });
      }

      if (roas < 1.0 && totalSpend > 0) {
        newAlerts.push({
          id: uuidv4(),
          title: `Negative ROAS on ${channel}`,
          description: `${channel} is generating $${roas.toFixed(2)} per $1 spent. Total revenue: $${totalRevenue.toFixed(2)}, spend: $${totalSpend.toFixed(2)}.`,
          severity: 'critical',
          channel,
          category: 'performance',
          rootCause: 'Cost per acquisition exceeds customer lifetime value or targeting inefficiency',
          suggestedAction: 'Pause underperforming campaigns, audit audiences, review conversion funnel',
          createdAt: now,
          acknowledged: false,
        });
      } else if (roas < 2.0 && totalSpend > 0) {
        newAlerts.push({
          id: uuidv4(),
          title: `Low ROAS on ${channel}`,
          description: `${channel} ROAS of ${roas.toFixed(2)}x is below the 2.0x efficiency threshold.`,
          severity: 'warning',
          channel,
          category: 'performance',
          rootCause: 'Marginal profitability — scaling may erode margins further',
          suggestedAction: 'Optimize bid strategy, tighten audience targeting, test new creatives',
          createdAt: now,
          acknowledged: false,
        });
      }

      if (variance > avg(revenues) * 0.5 && avg(revenues) > 0) {
        newAlerts.push({
          id: uuidv4(),
          title: `High volatility on ${channel}`,
          description: `Revenue standard deviation (${variance.toFixed(2)}) exceeds 50% of the mean (${avg(revenues).toFixed(2)}).`,
          severity: 'info',
          channel,
          category: 'stability',
          rootCause: 'Inconsistent daily performance may indicate inconsistent impression delivery or erratic bidding',
          suggestedAction: 'Use automated bidding, set consistent daily budgets, check pacing settings',
          createdAt: now,
          acknowledged: false,
        });
      }
    }

    if (forecastResult?.forecast) {
      const forecastValues: number[] = forecastResult.forecast.map((f: any) => f.predicted || f.value || 0);
      if (forecastValues.length >= 7) {
        const lastWeek = forecastValues.slice(-7);
        const prevWeek = forecastValues.slice(-14, -7);
        if (prevWeek.length > 0) {
          const weekOverWeekTrend = trendDirection([...prevWeek, ...lastWeek]);
          if (weekOverWeekTrend < -0.1) {
            newAlerts.push({
              id: uuidv4(),
              title: 'Forecast projects declining revenue',
              description: `ML model forecasts a ${(Math.abs(weekOverWeekTrend) * 100).toFixed(1)}% week-over-week revenue decline.`,
              severity: 'critical',
              channel: 'all',
              category: 'forecast',
              rootCause: 'Forecast model projects continued negative trajectory based on current trends',
              suggestedAction: 'Implement corrective budget actions now to reverse projected decline',
              createdAt: now,
              acknowledged: false,
            });
          }
        }
      }

      if (forecastResult.confidence_score && forecastResult.confidence_score < 0.6) {
        newAlerts.push({
          id: uuidv4(),
          title: 'Low forecast confidence',
          description: `Forecast confidence score is ${(forecastResult.confidence_score * 100).toFixed(1)}%, below the 60% reliability threshold.`,
          severity: 'warning',
          channel: 'all',
          category: 'model',
          rootCause: 'Insufficient historical data, high volatility, or regime change in data patterns',
          suggestedAction: 'Collect more data before making major budget decisions; treat forecasts as directional only',
          createdAt: now,
          acknowledged: false,
        });
      }
    }

    if (newAlerts.length === 0) {
      newAlerts.push({
        id: uuidv4(),
        title: 'All channels performing normally',
        description: 'No anomalies, declining trends, or performance issues detected across monitored channels.',
        severity: 'info',
        channel: 'all',
        category: 'status',
        rootCause: 'N/A',
        suggestedAction: 'Continue monitoring; consider optimizing for incremental gains',
        createdAt: now,
        acknowledged: false,
      });
    }

    newAlerts.sort((a, b) => (SEVERITY_WEIGHTS[b.severity] || 0) - (SEVERITY_WEIGHTS[a.severity] || 0));

    await saveAlerts(newAlerts);
    return newAlerts;
  }

  async acknowledgeAlert(alertId: string): Promise<boolean> {
    return acknowledgeAlertById(alertId);
  }

  async acknowledgeAll(): Promise<number> {
    return dbAcknowledgeAll();
  }

  async getAlerts(filters?: AlertFilters): Promise<Alert[]> {
    return getAllAlerts(filters);
  }

  async getUnreadCount(): Promise<number> {
    return getUnreadAlertCount();
  }
}

export const alertIntelligence = new AlertIntelligenceService();
