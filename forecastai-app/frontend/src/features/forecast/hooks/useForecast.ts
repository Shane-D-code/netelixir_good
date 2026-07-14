import { useMutation, useQuery } from '@tanstack/react-query';
import { forecastAPI, budgetAPI } from '../services/forecast.service';
import { tokenManager } from '../../auth/services/auth.service';
import { useForecastStore } from '../store/forecast.store';
import { UploadPreview } from '../../../shared/types';

export function useGenerateForecast() {
  const setForecastResult = useForecastStore((s) => s.setForecastResult);
  const setError = useForecastStore((s) => s.setError);

  return useMutation({
    mutationFn: ({
      file,
      params,
      onProgress,
    }: {
      file: File;
      params: {
        channel_budgets: Record<string, number>;
        forecast_days: number;
        confidence_level: number;
        n_simulations: number;
        enable_enhanced?: boolean;
        enable_ai_insights?: boolean;
        enable_caching?: boolean;
        enable_anomaly_detection?: boolean;
        enable_causal_inference?: boolean;
        enable_campaign_decomposition?: boolean;
        enable_risk_metrics?: boolean;
      };
      onProgress?: (progress: number, status: string) => void;
    }) => forecastAPI.generate(file, params, onProgress),
    onSuccess: (data) => {
      setForecastResult(data);
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });
}

export function useSimulateBudget() {
  return useMutation({
    mutationFn: (params: {
      channel: string;
      percentage_change: number;
      current_budgets: Record<string, number>;
      base_revenue: number;
    }) => budgetAPI.simulate(params),
  });
}

export function useOptimizeBudget() {
  const setOptimizationResult = useForecastStore((s) => s.setOptimizationResult);

  return useMutation({
    mutationFn: (params: {
      current_budgets: Record<string, number>;
      total_budget: number;
      historical_roas: Record<string, number>;
    }) => budgetAPI.optimize(params),
    onSuccess: (data) => {
      setOptimizationResult(data);
    },
  });
}

export function useExportForecast() {
  return useMutation({
    mutationFn: (resultId: string) => forecastAPI.exportCSV(resultId),
  });
}

export function useUploadPreview() {
  return useMutation({
    mutationFn: async (file: File): Promise<UploadPreview> => {
      const formData = new FormData();
      formData.append('file', file);
      const token = tokenManager.getToken();
      const response = await fetch('/api/upload/csv', {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });
      const json = await response.json();
      if (!json.success) throw new Error(json.error || 'Upload failed');
      return json.data;
    },
  });
}
