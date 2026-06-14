import { RawDataRow } from '../models/ForecastRequest';
import { AnalyticsMetrics } from '../models/ForecastResult';
export declare class AnalyticsService {
    computeChannelMetrics(data: RawDataRow[]): AnalyticsMetrics['channel_metrics'];
    computePerformanceMetrics(data: RawDataRow[], channelBudgets: Record<string, number>): AnalyticsMetrics['performance_metrics'];
    generateAccuracyReport(metrics: AnalyticsMetrics['performance_metrics']): string;
}
export declare const analyticsService: AnalyticsService;
//# sourceMappingURL=analyticsService.d.ts.map