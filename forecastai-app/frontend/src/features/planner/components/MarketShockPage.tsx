import React, { useState, useCallback } from 'react';
import GlassCard from '../../../shared/components/ui/GlassCard';
import LoadingSpinner from '../../../shared/components/ui/LoadingSpinner';
import BackButton from '../../../shared/components/ui/BackButton';
import Button from '../../../shared/components/ui/Button';
import { marketShockApi } from '../../../services/feature-services';
import { useForecastStore } from '../../forecast/store/forecast.store';
import { formatCurrency, formatPercent, classNames } from '../../../shared/utils/formatters';
import type { MarketShockResult } from '../../../shared/types/features';

const SHOCK_TYPES = [
  {
    id: 'competitor_sale',
    label: 'Competitor Sale',
    description: 'Major competitor launches aggressive discount campaign',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    id: 'algorithm_update',
    label: 'Algorithm Update',
    description: 'Platform algorithm change affecting ad delivery and costs',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    id: 'supply_chain',
    label: 'Supply Chain',
    description: 'Supply chain disruption impacting inventory and sales velocity',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
] as const;

const SEVERITIES = ['low', 'medium', 'high'] as const;

const severityColors: Record<string, string> = {
  low: 'var(--text-tertiary)',
  medium: '#E8B84B',
  high: '#DC2626',
};

export default function MarketShockPage({ embedded }: { embedded?: boolean } = {}) {
  const [shockType, setShockType] = useState<string>('competitor_sale');
  const [severity, setSeverity] = useState<string>('medium');
  const [result, setResult] = useState<MarketShockResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadedData = useForecastStore((s) => s.uploadedData);
  const budgets = useForecastStore((s) => s.budgets);

  const handleSimulate = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = uploadedData || [];
      const res = await marketShockApi.simulate(shockType, severity, data, budgets);
      setResult(res.data.data || res.data);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Simulation failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [shockType, severity, uploadedData, budgets]);

  const impactColor = (value: number) => {
    if (value <= -30) return '#DC2626';
    if (value <= -15) return '#E8B84B';
    if (value < 0) return '#F59E0B';
    return '#10B981';
  };

  return (
    <div className={embedded ? '' : 'min-h-screen pt-24'}>
      <div className={embedded ? '' : 'mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'}>
        {!embedded && (
          <div className="mb-8">
            <div className="mb-2">
              <BackButton />
            </div>
            <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Market Shock Simulator</h1>
            <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
              Model the impact of external market disruptions on your revenue
            </p>
          </div>
        )}

        <div className="space-y-8">
          <GlassCard title="Shock Configuration">
            <div className="space-y-6">
              <div>
                <label className="mb-3 block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Shock Type</label>
                <div className="grid gap-4 sm:grid-cols-3">
                  {SHOCK_TYPES.map((shock) => (
                    <button
                      key={shock.id}
                      onClick={() => setShockType(shock.id)}
                      className={classNames(
                        'rounded-xl border p-5 text-left transition-all duration-200',
                        shockType === shock.id ? 'ring-2' : 'hover:scale-[1.02]'
                      )}
                      style={{
                        borderColor: shockType === shock.id ? 'var(--accent)' : 'var(--border)',
                        background: shockType === shock.id ? 'var(--accent-glow)' : 'var(--bg-hover)',
                        boxShadow: shockType === shock.id ? '0 0 20px rgba(200,168,107,0.15)' : 'none',
                        ...(shockType === shock.id ? { '--tw-ring-color': 'var(--accent)' } as React.CSSProperties : {}),
                      }}
                    >
                      <div className="mb-3" style={{ color: shockType === shock.id ? 'var(--accent)' : 'var(--text-tertiary)' }}>
                        {shock.icon}
                      </div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{shock.label}</p>
                      <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>{shock.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-3 block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Severity Level</label>
                <div className="flex gap-3">
                  {SEVERITIES.map((sev) => (
                    <button
                      key={sev}
                      onClick={() => setSeverity(sev)}
                      className={classNames(
                        'flex-1 rounded-lg border px-4 py-3 text-sm font-semibold capitalize transition-all duration-200',
                        severity === sev && 'scale-[1.02]'
                      )}
                      style={{
                        borderColor: severity === sev ? severityColors[sev] : 'var(--border)',
                        background: severity === sev ? `${severityColors[sev]}15` : 'var(--bg-hover)',
                        color: severity === sev ? severityColors[sev] : 'var(--text-tertiary)',
                        boxShadow: severity === sev ? `0 0 16px ${severityColors[sev]}20` : 'none',
                      }}
                    >
                      {sev}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleSimulate}
                  loading={isLoading}
                  disabled={isLoading}
                  size="lg"
                >
                  Run Simulation
                </Button>
              </div>
            </div>
          </GlassCard>

          {isLoading && (
            <GlassCard>
              <LoadingSpinner size="lg" text="Simulating market shock impact..." />
            </GlassCard>
          )}

          {error && (
            <div
              className="rounded-xl border p-4"
              style={{ borderColor: '#DC262640', background: '#DC262610' }}
            >
              <p className="text-sm" style={{ color: '#DC2626' }}>{error}</p>
            </div>
          )}

          {result && !isLoading && (
            <div className="animate-fade-in space-y-8">
              <GlassCard title="Impact Gauge">
                <div className="flex flex-col items-center gap-6 py-4 sm:flex-row sm:items-start">
                  <div className="relative h-48 w-48 flex-shrink-0">
                    <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                      <circle
                        cx="60"
                        cy="60"
                        r="50"
                        fill="none"
                        stroke="var(--bg-hover)"
                        strokeWidth="12"
                      />
                      <circle
                        cx="60"
                        cy="60"
                        r="50"
                        fill="none"
                        stroke={impactColor(result.impactGauge)}
                        strokeWidth="12"
                        strokeLinecap="round"
                        strokeDasharray={`${(result.impactGauge / 100) * 314} 314`}
                        className="transition-all duration-1000"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                        {result.impactGauge}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Impact Score</span>
                    </div>
                  </div>

                  <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-lg p-4" style={{ background: 'var(--bg-hover)' }}>
                        <p className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>Revenue Impact</p>
                        <p className="mt-1 text-xl font-bold" style={{ color: impactColor(result.revenueImpact) }}>
                          {formatPercent(result.revenueImpact / 100)}
                        </p>
                      </div>
                      <div className="rounded-lg p-4" style={{ background: 'var(--bg-hover)' }}>
                        <p className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>ROAS Impact</p>
                        <p className="mt-1 text-xl font-bold" style={{ color: impactColor(result.roasImpact) }}>
                          {formatPercent(result.roasImpact / 100)}
                        </p>
                      </div>
                    </div>
                    <div className="rounded-lg p-4" style={{ background: 'var(--bg-hover)' }}>
                      <p className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>Estimated Recovery Time</p>
                      <p className="mt-1 text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                        {result.recoveryTime} days
                      </p>
                    </div>
                  </div>
                </div>
              </GlassCard>

              <div className="grid gap-6 lg:grid-cols-2">
                <GlassCard title="Revenue Impact">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Projected Change</span>
                      <span className="text-lg font-bold" style={{ color: impactColor(result.revenueImpact) }}>
                        {formatPercent(result.revenueImpact / 100)}
                      </span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full" style={{ background: 'var(--bg-hover)' }}>
                      <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{
                          width: `${Math.min(Math.abs(result.revenueImpact), 100)}%`,
                          background: `linear-gradient(to right, ${impactColor(result.revenueImpact)}, ${impactColor(result.revenueImpact)}80)`,
                        }}
                      />
                    </div>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      Severity: <span className="capitalize font-medium">{result.severity}</span> · Shock: <span className="capitalize font-medium">{result.shockType.replace('_', ' ')}</span>
                    </p>
                  </div>
                </GlassCard>

                <GlassCard title="ROAS Impact">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Projected Change</span>
                      <span className="text-lg font-bold" style={{ color: impactColor(result.roasImpact) }}>
                        {formatPercent(result.roasImpact / 100)}
                      </span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full" style={{ background: 'var(--bg-hover)' }}>
                      <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{
                          width: `${Math.min(Math.abs(result.roasImpact), 100)}%`,
                          background: `linear-gradient(to right, ${impactColor(result.roasImpact)}, ${impactColor(result.roasImpact)}80)`,
                        }}
                      />
                    </div>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      Recovery to baseline: ~{result.recoveryTime} days
                    </p>
                  </div>
                </GlassCard>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <GlassCard title="Recommendations">
                  <div className="space-y-3">
                    {result.recommendations && result.recommendations.length > 0 ? (
                      result.recommendations.map((rec, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-3 rounded-lg p-3"
                          style={{ background: 'var(--bg-hover)' }}
                        >
                          <span
                            className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                            style={{ background: 'var(--accent-glow)', color: 'var(--accent)' }}
                          >
                            {i + 1}
                          </span>
                          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{rec}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>No recommendations available.</p>
                    )}
                  </div>
                </GlassCard>

                <GlassCard title="Recovery Timeline">
                  <div className="space-y-4">
                    {result.recoveryTimeline && result.recoveryTimeline.length > 0 ? (
                      result.recoveryTimeline.map((point, i) => (
                        <div key={i}>
                          <div className="mb-1 flex items-center justify-between text-sm">
                            <span style={{ color: 'var(--text-secondary)' }}>Day {point.day}</span>
                            <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{point.recoveryPercent.toFixed(0)}%</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full" style={{ background: 'var(--bg-hover)' }}>
                            <div
                              className="h-full rounded-full transition-all duration-1000"
                              style={{
                                width: `${point.recoveryPercent}%`,
                                background: `linear-gradient(to right, ${impactColor(-50 + point.recoveryPercent)}, var(--accent))`,
                              }}
                            />
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="space-y-2">
                        {Array.from({ length: 5 }, (_, i) => {
                          const day = (i + 1) * Math.ceil(result.recoveryTime / 5);
                          const pct = (i + 1) * 20;
                          return (
                            <div key={i}>
                              <div className="mb-1 flex items-center justify-between text-sm">
                                <span style={{ color: 'var(--text-secondary)' }}>Day {day}</span>
                                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{Math.min(pct, 100)}%</span>
                              </div>
                              <div className="h-2 overflow-hidden rounded-full" style={{ background: 'var(--bg-hover)' }}>
                                <div
                                  className="h-full rounded-full transition-all duration-1000"
                                  style={{
                                    width: `${Math.min(pct, 100)}%`,
                                    background: `linear-gradient(to right, ${impactColor(-50 + pct)}, var(--accent))`,
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </GlassCard>
              </div>
            </div>
          )}

          {!result && !isLoading && !error && (
            <GlassCard>
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full" style={{ background: 'var(--accent-glow)' }}>
                  <svg className="h-8 w-8" style={{ color: 'var(--accent)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Configure a shock scenario and click <span style={{ color: 'var(--accent)' }}>Run Simulation</span> to see the projected impact
                </p>
              </div>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
}
