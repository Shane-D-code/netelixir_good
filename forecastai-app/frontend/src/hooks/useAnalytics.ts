import { useQuery } from '@tanstack/react-query';
import { analyticsAPI } from '../services/forecastService';
import { RawDataRow, AnalyticsMetrics, Anomaly, CausalDriver } from '../types';

export function useAnalyticsMetrics(data: RawDataRow[] | null, channelBudgets: Record<string, number>) {
  return useQuery<AnalyticsMetrics>({
    queryKey: ['analytics-metrics', data?.length, channelBudgets],
    queryFn: () => analyticsAPI.getMetrics(data!, channelBudgets),
    enabled: !!data && data.length > 0,
    staleTime: 30000,
    retry: 1,
  });
}

export function useAnomalies(data: RawDataRow[] | null) {
  return useQuery<Anomaly[]>({
    queryKey: ['analytics-anomalies', data?.length],
    queryFn: () => analyticsAPI.getAnomalies(data!),
    enabled: !!data && data.length > 0,
    staleTime: 30000,
    retry: 1,
  });
}

export function useCausalDrivers(data: RawDataRow[] | null) {
  return useQuery<CausalDriver[]>({
    queryKey: ['analytics-causal', data?.length],
    queryFn: () => analyticsAPI.getCausal(data!),
    enabled: !!data && data.length > 0,
    staleTime: 30000,
    retry: 1,
  });
}
