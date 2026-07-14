import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ForecastResult, UploadPreview, BudgetOptimizationResult, BudgetSimulationResult } from '../../../shared/types';

const DEFAULT_BUDGETS: Record<string, number> = {
  'Google Ads': 10000,
  'Meta Ads': 8000,
  'Microsoft Ads': 5000,
};

interface ForecastState {
  uploadedData: any[] | null;
  uploadPreview: UploadPreview | null;
  uploadedFile: File | null;
  forecastResult: ForecastResult | null;
  budgets: Record<string, number>;
  forecastDays: number;
  confidenceLevel: number;
  nSimulations: number;
  enableEnhanced: boolean;
  isLoading: boolean;
  isGenerating: boolean;
  error: string | null;
  simulationResult: BudgetSimulationResult | null;
  optimizationResult: BudgetOptimizationResult | null;

  setUploadedData: (data: any[] | null) => void;
  setUploadPreview: (preview: UploadPreview | null) => void;
  setUploadedFile: (file: File | null) => void;
  setBudgets: (budgets: Record<string, number>) => void;
  setForecastDays: (days: number) => void;
  setConfidenceLevel: (level: number) => void;
  setNSimulations: (n: number) => void;
  setEnableEnhanced: (enabled: boolean) => void;
  setForecastResult: (result: ForecastResult | null) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSimulationResult: (result: BudgetSimulationResult | null) => void;
  setOptimizationResult: (result: BudgetOptimizationResult | null) => void;
  reset: () => void;
}

export const useForecastStore = create<ForecastState>()(
  persist(
    (set) => ({
      uploadedData: null,
      uploadPreview: null,
      uploadedFile: null,
      forecastResult: null,
      budgets: DEFAULT_BUDGETS,
      forecastDays: 60,
      confidenceLevel: 0.8,
      nSimulations: 1000,
      enableEnhanced: true,
      isLoading: false,
      isGenerating: false,
      error: null,
      simulationResult: null,
      optimizationResult: null,

      setUploadedData: (data) => set({ uploadedData: data }),
      setUploadPreview: (preview) => set({ uploadPreview: preview }),
      setUploadedFile: (file) => set({ uploadedFile: file }),
      setBudgets: (budgets) => set({ budgets }),
      setForecastDays: (days) => set({ forecastDays: days }),
      setConfidenceLevel: (level) => set({ confidenceLevel: level }),
      setNSimulations: (n) => set({ nSimulations: n }),
      setEnableEnhanced: (enabled) => set({ enableEnhanced: enabled }),
      setForecastResult: (result) => set({ forecastResult: result, isGenerating: false }),
      setIsLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error, isGenerating: false }),
      setSimulationResult: (result) => set({ simulationResult: result }),
      setOptimizationResult: (result) => set({ optimizationResult: result }),
      reset: () => set({
        uploadedData: null,
        uploadPreview: null,
        uploadedFile: null,
        forecastResult: null,
        budgets: DEFAULT_BUDGETS,
        forecastDays: 60,
        confidenceLevel: 0.8,
        nSimulations: 1000,
        enableEnhanced: true,
        isLoading: false,
        isGenerating: false,
        error: null,
        simulationResult: null,
        optimizationResult: null,
      }),
    }),
    {
      name: 'forecastai-data',
      partialize: (state) => {
        const result = state.forecastResult;
        let forecastResult;
        if (result) {
          const { channel_forecasts, total_forecast, ...summary } = result;
          forecastResult = {
            ...summary,
            channel_forecasts: {},
            total_forecast: null,
          };
        } else {
          forecastResult = null;
        }
        return {
          forecastResult,
          budgets: state.budgets,
          forecastDays: state.forecastDays,
          confidenceLevel: state.confidenceLevel,
          nSimulations: state.nSimulations,
          enableEnhanced: state.enableEnhanced,
          uploadPreview: state.uploadPreview,
          uploadedData: state.uploadedData,
          simulationResult: state.simulationResult,
          optimizationResult: state.optimizationResult,
        };
      },
    }
  )
);
