import api from './api';
import { ForecastResult, RawDataRow } from '../types';

interface GenerateResponse {
  success: boolean;
  jobId: string;
  message: string;
}

interface StatusResponse {
  success: boolean;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  error?: string;
  result?: ForecastResult;
}

export const forecastAPI = {
  generate: async (
    file: File,
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
    },
    onProgress?: (progress: number, status: string) => void
  ): Promise<ForecastResult> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('channel_budgets', JSON.stringify(params.channel_budgets));
    formData.append('forecast_days', String(params.forecast_days));
    formData.append('confidence_level', String(params.confidence_level));
    formData.append('n_simulations', String(params.n_simulations));
    formData.append('enable_enhanced', String(params.enable_enhanced ?? true));
    formData.append('enable_ai_insights', String(params.enable_ai_insights ?? true));
    formData.append('enable_caching', String(params.enable_caching ?? true));
    formData.append('enable_anomaly_detection', String(params.enable_anomaly_detection ?? true));
    formData.append('enable_causal_inference', String(params.enable_causal_inference ?? true));
    formData.append('enable_campaign_decomposition', String(params.enable_campaign_decomposition ?? true));
    formData.append('enable_risk_metrics', String(params.enable_risk_metrics ?? true));

    const response = await api.post<GenerateResponse>('/forecast/generate', formData, {
      timeout: 30000,
    });

    if (!response.data.success || !response.data.jobId) {
      throw new Error('Failed to start forecast generation');
    }

    const { jobId } = response.data;
    onProgress?.(0, 'starting');

    return pollForecastResult(jobId, onProgress);
  },

  getStatus: async (id: string) => {
    const response = await api.get<StatusResponse>(`/forecast/status/${id}`);
    return response.data;
  },

  exportCSV: async (resultId: string) => {
    const response = await api.get(`/forecast/export/${resultId}`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

async function pollForecastResult(
  jobId: string,
  onProgress?: (progress: number, status: string) => void
): Promise<ForecastResult> {
  const poll = async (): Promise<ForecastResult> => {
    const response = await api.get<StatusResponse>(`/forecast/status/${jobId}`);
    const { status, progress, error, result } = response.data;

    onProgress?.(progress, status);

    if (status === 'completed' && result) {
      return result;
    }

    if (status === 'failed') {
      throw new Error(error || 'Forecast generation failed');
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));
    return poll();
  };

  return poll();
}

export const uploadAPI = {
  upload: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/upload/csv', formData);
    return response.data.data;
  },
};

export const budgetAPI = {
  simulate: async (params: {
    channel: string;
    percentage_change: number;
    current_budgets: Record<string, number>;
    base_revenue: number;
  }) => {
    const response = await api.post('/budget/simulate', params);
    return response.data.data;
  },

  optimize: async (params: {
    current_budgets: Record<string, number>;
    total_budget: number;
    historical_roas: Record<string, number>;
  }) => {
    const response = await api.post('/budget/optimize', params);
    return response.data.data;
  },

  getElasticity: async (channel: string, currentBudgets: Record<string, number>, baseRevenue: number) => {
    const response = await api.get(`/budget/elasticity/${channel}`, {
      params: {
        current_budgets: JSON.stringify(currentBudgets),
        base_revenue: baseRevenue,
      },
    });
    return response.data.data;
  },
};

export const analyticsAPI = {
  getMetrics: async (data: RawDataRow[], channelBudgets: Record<string, number>) => {
    const response = await api.post('/analytics/metrics', { data, channel_budgets: channelBudgets });
    return response.data.data;
  },

  getAnomalies: async (data: RawDataRow[]) => {
    const response = await api.post('/analytics/anomalies', { data });
    return response.data.data;
  },

  getCausal: async (data: RawDataRow[]) => {
    const response = await api.post('/analytics/causal', { data });
    return response.data.data;
  },
};
