import api from './api.service';

// Goal Planner
export const goalPlannerApi = {
  plan: (targetRevenue: number, days: number, currentBudgets?: Record<string, number>) =>
    api.post('/planner/goal', { targetRevenue, days, currentBudgets }),
};

// Promotion Simulator
export const promotionApi = {
  simulate: (params: { discountPercent: number; currentRevenue: number; currentAOV: number; profitMargin: number; elasticity: number }) =>
    api.post('/planner/promo', {
      ...params,
      profitMargin: params.profitMargin / 100,
    }),
};

// Stress Test
export const stressTestApi = {
  run: (data: any[], budgets: Record<string, number>) =>
    api.post('/planner/stress', { data, budgets }),
};

// Creative Fatigue
export const creativeFatigueApi = {
  detect: (creatives: any[]) =>
    api.post('/creative-fatigue/detect', { creatives }),
};

// Market Shock
export const marketShockApi = {
  simulate: (shockType: string, severity: string, data: any[], budgets: Record<string, number>) =>
    api.post('/planner/market-shock', { shockType, severity, data, budgets }),
};

// Alerts
export const alertsApi = {
  generate: (data: any[], forecastResult: any) =>
    api.post('/alerts/generate', { data, forecastResult }),
  getAll: (filters?: Record<string, string>) =>
    api.get('/alerts', { params: filters }),
  acknowledge: (id: string) =>
    api.post(`/alerts/acknowledge/${id}`),
  acknowledgeAll: () =>
    api.post('/alerts/acknowledge-all'),
  getUnreadCount: () =>
    api.get('/alerts/unread-count'),
};

// Time Machine
export const timeMachineApi = {
  recalculate: (budgets: Record<string, number>, data: any[]) =>
    api.post('/time-machine/recalculate', { budgets, data }),
  getPresets: () =>
    api.get('/time-machine/presets'),
  findOptimal: (data: any[], totalBudget: number) =>
    api.post('/time-machine/optimal', { data, totalBudget }),
};

// Executive Summary
export const reportApi = {
  generate: (params: any) =>
    api.post('/reports/generate', params),
  getTemplates: () =>
    api.get('/reports/templates'),
};
