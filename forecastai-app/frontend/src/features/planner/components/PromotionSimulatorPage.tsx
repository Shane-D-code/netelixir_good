import React, { useState, useCallback, useEffect, useRef } from 'react';
import GlassCard from '../../../shared/components/ui/GlassCard';
import MetricCard from '../../../shared/components/ui/MetricCard';
import LoadingSpinner from '../../../shared/components/ui/LoadingSpinner';
import BackButton from '../../../shared/components/ui/BackButton';
import { promotionApi } from '../../../services/feature-services';
import { formatCurrency, classNames } from '../../../shared/utils/formatters';

interface SimulationResult {
  before: {
    revenue: number;
    aov: number;
    profit: number;
    roas: number;
    volume: number;
  };
  after: {
    revenue: number;
    aov: number;
    profit: number;
    roas: number;
    volume: number;
  };
  volume_increase_percent: number;
  margin_impact: number;
  recommendation: string;
}

interface SliderInputProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  prefix?: string;
  onChange: (val: number) => void;
}

function SliderInput({ label, value, min, max, step = 1, unit = '', prefix = '', onChange }: SliderInputProps) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</label>
        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          {prefix}{typeof value === 'number' ? (step < 1 ? value.toFixed(1) : value.toLocaleString()) : value}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full slider-premium"
        style={{ accentColor: 'var(--accent)' }}
      />
      <div className="mt-1 flex justify-between text-xs" style={{ color: 'var(--text-tertiary)' }}>
        <span>{prefix}{min}{unit}</span>
        <span>{prefix}{max}{unit}</span>
      </div>
    </div>
  );
}

function ComparisonArrow({ label, before, after, formatter, isPositiveBetter = true }: {
  label: string;
  before: number;
  after: number;
  formatter: (v: number) => string;
  isPositiveBetter?: boolean;
}) {
  const diff = after - before;
  const improved = isPositiveBetter ? diff > 0 : diff < 0;
  const neutral = diff === 0;

  return (
    <div className="flex items-center justify-between rounded-lg p-3" style={{ background: 'var(--bg-hover)' }}>
      <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>{label}</span>
      <div className="flex items-center gap-3">
        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{formatter(before)}</span>
        <svg
          className="h-4 w-4 flex-shrink-0"
          style={{ color: neutral ? 'var(--text-tertiary)' : improved ? '#34D399' : '#F87171' }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
        <span className={classNames('text-sm font-semibold', neutral ? '' : improved ? 'trend-up' : 'trend-down')}>
          {formatter(after)}
        </span>
      </div>
    </div>
  );
}

export default function PromotionSimulatorPage({ embedded }: { embedded?: boolean } = {}) {
  const [discount, setDiscount] = useState<number>(15);
  const [currentRevenue, setCurrentRevenue] = useState<number>(100000);
  const [currentAOV, setCurrentAOV] = useState<number>(75);
  const [profitMargin, setProfitMargin] = useState<number>(40);
  const [elasticity, setElasticity] = useState<number>(1.5);

  const [result, setResult] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastParamsRef = useRef<string>('');

  const runSimulation = useCallback(async (params: {
    discountPercent: number;
    currentRevenue: number;
    currentAOV: number;
    profitMargin: number;
    elasticity: number;
  }) => {
    const paramsKey = JSON.stringify(params);
    if (paramsKey === lastParamsRef.current) return;
    lastParamsRef.current = paramsKey;

    setLoading(true);
    setError(null);
    try {
      const response = await promotionApi.simulate(params);
      const raw = response.data.data;
      const beforeData = raw.beforeAfter?.[0] || { revenue: 0, aov: 0, profit: 0, roas: 0 };
      const afterData = raw.beforeAfter?.[1] || { revenue: 0, aov: 0, profit: 0, roas: 0 };
      setResult({
        before: { ...beforeData, volume: beforeData.aov > 0 ? beforeData.revenue / beforeData.aov : 0 },
        after: { ...afterData, volume: afterData.aov > 0 ? afterData.revenue / afterData.aov : 0 },
        volume_increase_percent: raw.volumeIncrease ?? 0,
        margin_impact: raw.marginImpact ?? 0,
        recommendation: raw.recommendation ?? '',
      });
    } catch (err: any) {
      setError(err?.message || 'Simulation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const params = {
      discountPercent: discount,
      currentRevenue,
      currentAOV,
      profitMargin,
      elasticity,
    };

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      runSimulation(params);
    }, 600);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [discount, currentRevenue, currentAOV, profitMargin, elasticity, runSimulation]);

  return (
    <div className={embedded ? '' : 'min-h-screen pt-24'}>
      <div className={embedded ? '' : 'mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'}>
        {!embedded && (
          <div className="mb-8">
            <div className="mb-2">
              <BackButton />
            </div>
            <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Promotion Simulator</h1>
            <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>Model the impact of discount promotions on revenue and profitability</p>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
          <div className="space-y-6">
            <GlassCard title="Simulation Parameters">
              <div className="space-y-6">
                <SliderInput
                  label="Discount %"
                  value={discount}
                  min={0}
                  max={50}
                  step={1}
                  unit="%"
                  onChange={setDiscount}
                />

                <SliderInput
                  label="Current Revenue"
                  value={currentRevenue}
                  min={10000}
                  max={5000000}
                  step={5000}
                  prefix="$"
                  onChange={setCurrentRevenue}
                />

                <SliderInput
                  label="Current AOV"
                  value={currentAOV}
                  min={10}
                  max={500}
                  step={5}
                  prefix="$"
                  onChange={setCurrentAOV}
                />

                <SliderInput
                  label="Profit Margin"
                  value={profitMargin}
                  min={0}
                  max={100}
                  step={1}
                  unit="%"
                  onChange={setProfitMargin}
                />

                <SliderInput
                  label="Price Elasticity"
                  value={elasticity}
                  min={1}
                  max={3}
                  step={0.1}
                  onChange={setElasticity}
                />
              </div>
            </GlassCard>

            {error && (
              <div className="rounded-lg p-4 text-sm" style={{ border: '1px solid var(--accent-soft-glow)', background: 'var(--accent-glow)', color: 'var(--accent)' }}>
                {error}
              </div>
            )}
          </div>

          <div className="space-y-6">
            {loading && !result && (
              <GlassCard>
                <LoadingSpinner text="Running promotion simulation..." />
              </GlassCard>
            )}

            {result && (
              <>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <MetricCard
                    title="Volume Increase"
                    value={`+${result.volume_increase_percent.toFixed(1)}%`}
                    subtitle="Expected order volume"
                    delta={{ text: 'More orders', isPositive: result.volume_increase_percent > 0 }}
                  />
                  <MetricCard
                    title="Revenue Change"
                    value={formatCurrency(result.after.revenue)}
                    subtitle={`Was ${formatCurrency(result.before.revenue)}`}
                    delta={{
                      text: `${((result.after.revenue - result.before.revenue) / Math.max(1, result.before.revenue) * 100).toFixed(1)}%`,
                      isPositive: result.after.revenue >= result.before.revenue,
                    }}
                  />
                  <MetricCard
                    title="Profit Impact"
                    value={formatCurrency(result.after.profit)}
                    subtitle={`Margin: ${result.margin_impact.toFixed(1)}%`}
                    delta={{
                      text: formatCurrency(result.after.profit - result.before.profit),
                      isPositive: result.after.profit >= result.before.profit,
                    }}
                  />
                  <MetricCard
                    title="New ROAS"
                    value={`${result.after.roas.toFixed(2)}x`}
                    subtitle={`Was ${result.before.roas.toFixed(2)}x`}
                    delta={{
                      text: `${(result.after.roas - result.before.roas).toFixed(2)}x`,
                      isPositive: result.after.roas >= result.before.roas,
                    }}
                  />
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <GlassCard title="Before Promotion">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between rounded-lg p-3" style={{ background: 'var(--bg-hover)' }}>
                        <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Revenue</span>
                        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{formatCurrency(result.before.revenue)}</span>
                      </div>
                      <div className="flex items-center justify-between rounded-lg p-3" style={{ background: 'var(--bg-hover)' }}>
                        <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>AOV</span>
                        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{formatCurrency(result.before.aov)}</span>
                      </div>
                      <div className="flex items-center justify-between rounded-lg p-3" style={{ background: 'var(--bg-hover)' }}>
                        <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Profit</span>
                        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{formatCurrency(result.before.profit)}</span>
                      </div>
                      <div className="flex items-center justify-between rounded-lg p-3" style={{ background: 'var(--bg-hover)' }}>
                        <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>ROAS</span>
                        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{result.before.roas.toFixed(2)}x</span>
                      </div>
                      <div className="flex items-center justify-between rounded-lg p-3" style={{ background: 'var(--bg-hover)' }}>
                        <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Volume</span>
                        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{result.before.volume.toLocaleString()}</span>
                      </div>
                    </div>
                  </GlassCard>

                  <GlassCard title="After Promotion" badge={`${discount}% off`}>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between rounded-lg p-3" style={{ background: 'var(--bg-hover)' }}>
                        <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Revenue</span>
                        <span className={classNames('text-sm font-semibold', result.after.revenue >= result.before.revenue ? 'trend-up' : 'trend-down')}>
                          {formatCurrency(result.after.revenue)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between rounded-lg p-3" style={{ background: 'var(--bg-hover)' }}>
                        <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>AOV</span>
                        <span className={classNames('text-sm font-semibold', result.after.aov >= result.before.aov ? 'trend-up' : 'trend-down')}>
                          {formatCurrency(result.after.aov)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between rounded-lg p-3" style={{ background: 'var(--bg-hover)' }}>
                        <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Profit</span>
                        <span className={classNames('text-sm font-semibold', result.after.profit >= result.before.profit ? 'trend-up' : 'trend-down')}>
                          {formatCurrency(result.after.profit)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between rounded-lg p-3" style={{ background: 'var(--bg-hover)' }}>
                        <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>ROAS</span>
                        <span className={classNames('text-sm font-semibold', result.after.roas >= result.before.roas ? 'trend-up' : 'trend-down')}>
                          {result.after.roas.toFixed(2)}x
                        </span>
                      </div>
                      <div className="flex items-center justify-between rounded-lg p-3" style={{ background: 'var(--bg-hover)' }}>
                        <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Volume</span>
                        <span className={classNames('text-sm font-semibold', result.after.volume >= result.before.volume ? 'trend-up' : 'trend-down')}>
                          {result.after.volume.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </GlassCard>
                </div>

                <GlassCard title="Comparison Summary">
                  <div className="space-y-2">
                    <ComparisonArrow label="Revenue" before={result.before.revenue} after={result.after.revenue} formatter={formatCurrency} />
                    <ComparisonArrow label="AOV" before={result.before.aov} after={result.after.aov} formatter={formatCurrency} />
                    <ComparisonArrow label="Profit" before={result.before.profit} after={result.after.profit} formatter={formatCurrency} />
                    <ComparisonArrow label="ROAS" before={result.before.roas} after={result.after.roas} formatter={(v) => `${v.toFixed(2)}x`} />
                    <ComparisonArrow label="Volume" before={result.before.volume} after={result.after.volume} formatter={(v) => v.toLocaleString()} />
                  </div>
                </GlassCard>

                <GlassCard title="AI Recommendation" badge="AI">
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {result.recommendation}
                  </p>
                </GlassCard>
              </>
            )}

            {!loading && !result && !error && (
              <GlassCard>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full" style={{ background: 'var(--bg-hover)' }}>
                    <svg className="h-8 w-8" style={{ color: 'var(--text-tertiary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                    </svg>
                  </div>
                  <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                    Adjust the sliders to simulate promotion impact in real-time.
                  </p>
                </div>
              </GlassCard>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
