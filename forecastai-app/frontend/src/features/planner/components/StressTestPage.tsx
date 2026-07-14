import React, { useState, useCallback } from 'react';
import GlassCard from '../../../shared/components/ui/GlassCard';
import MetricCard from '../../../shared/components/ui/MetricCard';
import LoadingSpinner from '../../../shared/components/ui/LoadingSpinner';
import BackButton from '../../../shared/components/ui/BackButton';
import { stressTestApi } from '../../../services/feature-services';
import { formatCurrency, classNames } from '../../../shared/utils/formatters';
import { useForecastStore } from '../../forecast/store/forecast.store';

interface ScenarioResult {
  name: string;
  description: string;
  revenue_impact_dollar: number;
  revenue_impact_percent: number;
  roas_impact: number;
  confidence_score: number;
  severity: 'low' | 'medium' | 'high';
  recommendation: string;
}

interface StressTestResult {
  scenarios: ScenarioResult[];
  overall_resilience_score: number;
}

const SCENARIOS = [
  {
    key: 'cpc_increase',
    name: 'CPC Increase',
    description: 'Cost per click rises by 30% across all channels',
    icon: '📈',
    color: '#F59E0B',
  },
  {
    key: 'cvr_drop',
    name: 'CVR Drop',
    description: 'Conversion rate drops by 20% industry-wide',
    icon: '📉',
    color: '#EF4444',
  },
  {
    key: 'budget_cut',
    name: 'Budget Cut',
    description: 'Total marketing budget reduced by 30%',
    icon: '✂️',
    color: '#8B5CF6',
  },
  {
    key: 'market_downturn',
    name: 'Market Downturn',
    description: 'Consumer spending declines by 15% overall',
    icon: '🌧️',
    color: '#6366F1',
  },
];

const SEVERITY_CONFIG = {
  low: { label: 'Low Impact', bg: 'rgba(52,211,153,0.12)', color: '#34D399', border: 'rgba(52,211,153,0.25)' },
  medium: { label: 'Medium Impact', bg: 'rgba(251,191,36,0.12)', color: '#FBBF24', border: 'rgba(251,191,36,0.25)' },
  high: { label: 'High Impact', bg: 'rgba(248,113,113,0.12)', color: '#F87171', border: 'rgba(248,113,113,0.25)' },
};

function SeverityBadge({ severity }: { severity: 'low' | 'medium' | 'high' }) {
  const config = SEVERITY_CONFIG[severity];
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{ background: config.bg, color: config.color, border: `1px solid ${config.border}` }}
    >
      {config.label}
    </span>
  );
}

export default function StressTestPage({ embedded }: { embedded?: boolean } = {}) {
  const forecastResult = useForecastStore((s) => s.forecastResult);
  const budgets = useForecastStore((s) => s.budgets);

  const [result, setResult] = useState<StressTestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRunStressTest = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = forecastResult
        ? Object.entries(forecastResult.channel_metrics || {}).map(([channel, metrics]) => ({
            channel,
            revenue: metrics.total_revenue,
          }))
        : [];
      const response = await stressTestApi.run(data, budgets);
      setResult(response.data.data);
    } catch (err: any) {
      setError(err?.message || 'Stress test failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [forecastResult, budgets]);

  const resilienceColor = result
    ? result.overall_resilience_score >= 70
      ? '#34D399'
      : result.overall_resilience_score >= 40
        ? '#FBBF24'
        : '#F87171'
    : 'var(--text-tertiary)';

  return (
    <div className={embedded ? '' : 'min-h-screen pt-24'}>
      <div className={embedded ? '' : 'mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'}>
        {!embedded && (
          <div className="mb-8">
            <div className="mb-2">
              <BackButton />
            </div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Stress Test Dashboard</h1>
                <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>Evaluate how your revenue holds up under adverse conditions</p>
              </div>
              <button
                onClick={handleRunStressTest}
                disabled={loading}
                className="btn-primary flex items-center gap-2 self-start"
              >
                {loading ? (
                  <>
                    <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                    Running...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Run Stress Test
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {embedded && (
          <div className="mb-4 flex justify-end">
            <button
              onClick={handleRunStressTest}
              disabled={loading}
              className="btn-primary flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                  Running...
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Run Stress Test
                </>
              )}
            </button>
          </div>
        )}

        {result && (
          <div className="mb-8">
            <GlassCard title="Overall Resilience Score">
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative h-20 w-20 flex-shrink-0">
                    <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80">
                      <circle cx="40" cy="40" r="34" fill="none" stroke="var(--bg-hover)" strokeWidth="6" />
                      <circle
                        cx="40"
                        cy="40"
                        r="34"
                        fill="none"
                        stroke={resilienceColor}
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeDasharray={`${(result.overall_resilience_score / 100) * 213.6} 213.6`}
                        className="transition-all duration-1000"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xl font-bold" style={{ color: resilienceColor }}>
                        {result.overall_resilience_score}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Resilience Rating</p>
                    <p className="text-lg font-semibold" style={{ color: resilienceColor }}>
                      {result.overall_resilience_score >= 70
                        ? 'Resilient'
                        : result.overall_resilience_score >= 40
                          ? 'Moderate'
                          : 'Vulnerable'}
                    </p>
                  </div>
                </div>
                <p className="max-w-md text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  Your portfolio {result.overall_resilience_score >= 70
                    ? 'shows strong resilience against market stress scenarios. Continue monitoring key metrics.'
                    : result.overall_resilience_score >= 40
                      ? 'shows moderate resilience. Consider diversifying channels and building cash reserves.'
                      : 'is vulnerable to market shocks. Prioritize risk mitigation strategies immediately.'}
                </p>
              </div>
            </GlassCard>
          </div>
        )}

        {loading && !result && (
          <GlassCard>
            <LoadingSpinner text="Running stress scenarios across all channels..." />
          </GlassCard>
        )}

        {error && (
          <div className="mb-6 rounded-lg p-4 text-sm" style={{ border: '1px solid var(--accent-soft-glow)', background: 'var(--accent-glow)', color: 'var(--accent)' }}>
            {error}
          </div>
        )}

        <div className="grid gap-6 sm:grid-cols-2">
          {result
            ? result.scenarios.map((scenario, i) => {
                const severityCfg = SEVERITY_CONFIG[scenario.severity];
                return (
                  <GlassCard key={i}>
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-10 w-10 items-center justify-center rounded-lg text-lg"
                            style={{ background: 'var(--bg-hover)' }}
                          >
                            {SCENARIOS[i]?.icon || '⚡'}
                          </div>
                          <div>
                            <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{scenario.name}</h3>
                            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{scenario.description}</p>
                          </div>
                        </div>
                        <SeverityBadge severity={scenario.severity} />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-lg p-3" style={{ background: 'var(--bg-hover)' }}>
                          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Revenue Impact</p>
                          <p className={classNames('text-lg font-bold', scenario.revenue_impact_dollar >= 0 ? 'trend-up' : 'trend-down')}>
                            {formatCurrency(scenario.revenue_impact_dollar)}
                          </p>
                          <p className={classNames('text-xs font-medium', scenario.revenue_impact_percent >= 0 ? 'trend-up' : 'trend-down')}>
                            {scenario.revenue_impact_percent >= 0 ? '+' : ''}{scenario.revenue_impact_percent.toFixed(1)}%
                          </p>
                        </div>
                        <div className="rounded-lg p-3" style={{ background: 'var(--bg-hover)' }}>
                          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>ROAS Impact</p>
                          <p className={classNames('text-lg font-bold', scenario.roas_impact >= 0 ? 'trend-up' : 'trend-down')}>
                            {scenario.roas_impact.toFixed(2)}x
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full" style={{ background: severityCfg.color }} />
                          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                            Confidence: {scenario.confidence_score}%
                          </span>
                        </div>
                      </div>

                      <div className="rounded-lg p-3" style={{ background: 'var(--bg-hover)' }}>
                        <p className="mb-1 text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Recommendation</p>
                        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>{scenario.recommendation}</p>
                      </div>
                    </div>
                  </GlassCard>
                );
              })
            : SCENARIOS.map((s) => (
                <GlassCard key={s.key}>
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div
                      className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl text-xl"
                      style={{ background: 'var(--bg-hover)' }}
                    >
                      {s.icon}
                    </div>
                    <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{s.name}</h3>
                    <p className="mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>{s.description}</p>
                  </div>
                </GlassCard>
              ))}
        </div>

        {!loading && !result && !error && (
          <div className="mt-8 text-center">
            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
              Click "Run Stress Test" to simulate adverse market conditions on your revenue.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
