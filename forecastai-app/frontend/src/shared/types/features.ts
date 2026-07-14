export interface GoalPlanResult {
  targetRevenue: number;
  days: number;
  requiredBudgets: Record<string, number>;
  totalRequiredBudget: number;
  expectedROAS: number;
  confidenceScore: number;
  recommendations: Array<{ channel: string; action: string; expectedImpact: string; priority: 'high' | 'medium' | 'low' }>;
}

export interface PromotionResult {
  estimatedRevenue: number;
  estimatedAOV: number;
  estimatedProfit: number;
  estimatedROAS: number;
  volumeIncrease: number;
  marginImpact: number;
  recommendation: string;
  beforeAfter: Array<{ label: string; revenue: number; aov: number; profit: number; roas: number }>;
}

export interface StressScenario {
  name: string;
  type: string;
  description: string;
  revenueImpact: number;
  roasImpact: number;
  confidence: number;
  recommendation: string;
  severity: 'low' | 'medium' | 'high';
}

export interface StressTestResult {
  scenarios: StressScenario[];
  overallResilience: number;
}

export interface CreativeFatigue {
  id: string;
  name: string;
  channel: string;
  fatigueScore: number;
  performanceTrend: 'increasing' | 'stable' | 'decreasing';
  recommendedAction: 'refresh' | 'pause' | 'maintain';
  daysUntilCritical: number;
  currentCTR: number;
  historicalCTR: number;
}

export interface FatigueResult {
  creatives: CreativeFatigue[];
  summary: { totalCreatives: number; atRiskCount: number; criticalCount: number; averageFatigueScore: number };
}

export interface MarketShockResult {
  shockType: string;
  severity: string;
  revenueImpact: number;
  roasImpact: number;
  recoveryTime: number;
  recommendations: string[];
  impactGauge: number;
  recoveryTimeline: Array<{ day: number; recoveryPercent: number }>;
}

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

export interface TimeMachineResult {
  budgets: Record<string, number>;
  projectedRevenue: number;
  projectedROAS: number;
  channelRevenues: Record<string, number>;
  improvementPercent: number;
}

export interface PresetScenario {
  name: string;
  description: string;
  budgets: Record<string, number>;
}

export interface ExecutiveSummaryResult {
  html: string;
  sections: Array<{ title: string; content: string; type: string }>;
  generatedAt: string;
  template: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
}
