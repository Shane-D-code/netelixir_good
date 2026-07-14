import React, { useState, useCallback, useEffect } from 'react';
import GlassCard from '../../../shared/components/ui/GlassCard';
import LoadingSpinner from '../../../shared/components/ui/LoadingSpinner';
import BackButton from '../../../shared/components/ui/BackButton';
import Button from '../../../shared/components/ui/Button';
import { timeMachineApi } from '../../../services/feature-services';
import { useForecastStore } from '../../forecast/store/forecast.store';
import { formatCurrency, formatPercent, classNames } from '../../../shared/utils/formatters';
import type { TimeMachineResult, PresetScenario } from '../../../shared/types/features';

const CHANNELS = ['Google Ads', 'Meta Ads', 'Microsoft Ads'];

const PRESETS: PresetScenario[] = [
  {
    name: 'Aggressive Meta',
    description: 'Shift budget heavily to Meta for maximum reach',
    budgets: { 'Google Ads': 5000, 'Meta Ads': 15000, 'Microsoft Ads': 3000 },
  },
  {
    name: 'Balanced',
    description: 'Even distribution across all channels',
    budgets: { 'Google Ads': 7500, 'Meta Ads': 7500, 'Microsoft Ads': 7500 },
  },
  {
    name: 'Conservative',
    description: 'Minimize risk with lower overall spend',
    budgets: { 'Google Ads': 4000, 'Meta Ads': 3500, 'Microsoft Ads': 2500 },
  },
  {
    name: 'Optimal',
    description: 'Data-driven allocation for maximum ROAS',
    budgets: { 'Google Ads': 12000, 'Meta Ads': 9000, 'Microsoft Ads': 4000 },
  },
];

export default function TimeMachinePage() {
  const storeBudgets = useForecastStore((s) => s.budgets);
  const setStoreBudgets = useForecastStore((s) => s.setBudgets);
  const uploadedData = useForecastStore((s) => s.uploadedData);
  const forecastResult = useForecastStore((s) => s.forecastResult);

  const [budgets, setBudgets] = useState<Record<string, number>>(() => ({ ...storeBudgets }));
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [result, setResult] = useState<TimeMachineResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isFindingOptimal, setIsFindingOptimal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalBudget = Object.values(budgets).reduce((a, b) => a + b, 0);

  const handleBudgetChange = useCallback((channel: string, value: number) => {
    setBudgets((prev) => ({ ...prev, [channel]: Math.max(0, value) }));
    setActivePreset(null);
  }, []);

  const applyPreset = useCallback((preset: PresetScenario) => {
    setBudgets({ ...preset.budgets });
    setActivePreset(preset.name);
    setResult(null);
  }, []);

  const handleRecalculate = useCallback(async () => {
    setIsCalculating(true);
    setError(null);
    try {
      const data = uploadedData || [];
      const res = await timeMachineApi.recalculate(budgets, data);
      setResult(res.data.data || res.data);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Recalculation failed.');
    } finally {
      setIsCalculating(false);
    }
  }, [budgets, uploadedData]);

  const handleFindOptimal = useCallback(async () => {
    setIsFindingOptimal(true);
    setError(null);
    try {
      const data = uploadedData || [];
      const res = await timeMachineApi.findOptimal(data, totalBudget);
      const optimalResult = res.data.data || res.data;
      setResult(optimalResult);
      if (optimalResult.budgets) {
        setBudgets(optimalResult.budgets);
        setActivePreset('Optimal');
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Optimization failed.');
    } finally {
      setIsFindingOptimal(false);
    }
  }, [uploadedData, totalBudget]);

  const handleApplyToForecast = useCallback(() => {
    if (result?.budgets) {
      setStoreBudgets(result.budgets);
    }
  }, [result, setStoreBudgets]);

  const improvementColor = (val: number) => val >= 0 ? '#10B981' : '#DC2626';

  const currentRevenue = forecastResult?.p50_revenue || 0;
  const currentROAS = forecastResult?.roas || 0;

  return (
    <div className="min-h-screen pt-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="mb-2">
            <BackButton />
          </div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>ROAS Time Machine</h1>
          <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
            Explore alternative budget allocations and their projected impact
          </p>
        </div>

        <div className="space-y-8">
          <GlassCard title="Budget Allocation">
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-3">
                {CHANNELS.map((channel) => (
                  <div key={channel}>
                    <div className="mb-2 flex items-center justify-between">
                      <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{channel}</label>
                      <span className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>
                        {formatCurrency(budgets[channel] || 0)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={30000}
                      step={500}
                      value={budgets[channel] || 0}
                      onChange={(e) => handleBudgetChange(channel, parseInt(e.target.value))}
                      className="w-full"
                      style={{ accentColor: 'var(--accent)' }}
                    />
                    <div className="mt-1 flex justify-between text-[10px]" style={{ color: 'var(--text-muted)' }}>
                      <span>$0</span>
                      <span>$30K</span>
                    </div>
                  </div>
                ))}
              </div>

              <div
                className="flex items-center justify-between rounded-lg p-4"
                style={{ background: 'var(--bg-hover)' }}
              >
                <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Total Budget</span>
                <span className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {formatCurrency(totalBudget)}
                </span>
              </div>
            </div>
          </GlassCard>

          <GlassCard title="Presets">
            <div className="grid gap-3 sm:grid-cols-4">
              {PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => applyPreset(preset)}
                  className={classNames(
                    'rounded-xl border p-4 text-left transition-all duration-200',
                    activePreset === preset.name ? 'ring-2' : 'hover:scale-[1.02]'
                  )}
                  style={{
                    borderColor: activePreset === preset.name ? 'var(--accent)' : 'var(--border)',
                    background: activePreset === preset.name ? 'var(--accent-glow)' : 'var(--bg-hover)',
                    boxShadow: activePreset === preset.name ? '0 0 20px rgba(200,168,107,0.15)' : 'none',
                    ...(activePreset === preset.name ? { '--tw-ring-color': 'var(--accent)' } as React.CSSProperties : {}),
                  }}
                >
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{preset.name}</p>
                  <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>{preset.description}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {Object.entries(preset.budgets).map(([ch, val]) => (
                      <span key={ch} className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        {ch.split(' ')[0]}: {formatCurrency(val)}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </GlassCard>

          <div className="flex flex-wrap gap-3 justify-end">
            <Button
              onClick={handleRecalculate}
              loading={isCalculating}
              disabled={isCalculating || isFindingOptimal}
              variant="secondary"
              size="md"
            >
              Recalculate
            </Button>
            <Button
              onClick={handleFindOptimal}
              loading={isFindingOptimal}
              disabled={isCalculating || isFindingOptimal}
              size="md"
            >
              Find Optimal
            </Button>
          </div>

          {(isCalculating || isFindingOptimal) && (
            <GlassCard>
              <LoadingSpinner size="md" text={isFindingOptimal ? 'Finding optimal allocation...' : 'Recalculating projections...'} />
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

          {result && !isCalculating && !isFindingOptimal && (
            <div className="animate-fade-in space-y-8">
              <GlassCard title="Before / After Comparison">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-4">
                    <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Current</p>
                    <div className="rounded-lg p-4" style={{ background: 'var(--bg-hover)' }}>
                      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Revenue</p>
                      <p className="mt-1 text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                        {formatCurrency(currentRevenue)}
                      </p>
                    </div>
                    <div className="rounded-lg p-4" style={{ background: 'var(--bg-hover)' }}>
                      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>ROAS</p>
                      <p className="mt-1 text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                        {currentROAS.toFixed(2)}x
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--accent)' }}>Projected</p>
                    <div className="rounded-lg p-4" style={{ background: 'var(--accent-glow)' }}>
                      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Revenue</p>
                      <p className="mt-1 text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                        {formatCurrency(result.projectedRevenue)}
                      </p>
                    </div>
                    <div className="rounded-lg p-4" style={{ background: 'var(--accent-glow)' }}>
                      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>ROAS</p>
                      <p className="mt-1 text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                        {result.projectedROAS.toFixed(2)}x
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 rounded-lg p-4" style={{ background: result.improvementPercent >= 0 ? '#10B98110' : '#DC262610' }}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Net Improvement</span>
                    <span
                      className="text-lg font-bold"
                      style={{ color: improvementColor(result.improvementPercent) }}
                    >
                      {formatPercent(result.improvementPercent / 100)}
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full" style={{ background: 'var(--bg-hover)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${Math.min(Math.abs(result.improvementPercent), 100)}%`,
                        background: improvementColor(result.improvementPercent),
                      }}
                    />
                  </div>
                </div>
              </GlassCard>

              {result.channelRevenues && Object.keys(result.channelRevenues).length > 0 && (
                <GlassCard title="Channel Revenue Breakdown">
                  <div className="space-y-4">
                    {Object.entries(result.channelRevenues)
                      .sort(([, a], [, b]) => b - a)
                      .map(([channel, revenue]) => {
                        const maxRevenue = Math.max(...Object.values(result.channelRevenues));
                        const pct = maxRevenue > 0 ? (revenue / maxRevenue) * 100 : 0;
                        return (
                          <div key={channel}>
                            <div className="mb-1 flex items-center justify-between text-sm">
                              <span style={{ color: 'var(--text-secondary)' }}>{channel}</span>
                              <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{formatCurrency(revenue)}</span>
                            </div>
                            <div className="h-2.5 overflow-hidden rounded-full" style={{ background: 'var(--bg-hover)' }}>
                              <div
                                className="h-full rounded-full transition-all duration-1000"
                                style={{ width: `${pct}%`, background: 'linear-gradient(to right, var(--accent), var(--accent-soft))' }}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </GlassCard>
              )}

              <div className="flex justify-end">
                <Button
                  onClick={handleApplyToForecast}
                  size="lg"
                >
                  Apply to Current Forecast
                </Button>
              </div>
            </div>
          )}

          {!result && !isCalculating && !isFindingOptimal && !error && (
            <GlassCard>
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full" style={{ background: 'var(--accent-glow)' }}>
                  <svg className="h-8 w-8" style={{ color: 'var(--accent)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Adjust budget sliders or pick a preset, then click <span style={{ color: 'var(--accent)' }}>Recalculate</span>
                </p>
              </div>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
}
