import React, { useState, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import GlassCard from '../../../shared/components/ui/GlassCard';
import MetricCard from '../../../shared/components/ui/MetricCard';
import LoadingSpinner from '../../../shared/components/ui/LoadingSpinner';
import BackButton from '../../../shared/components/ui/BackButton';
import { goalPlannerApi } from '../../../services/feature-services';
import { formatCurrency, classNames } from '../../../shared/utils/formatters';
import { VALID_CHANNELS } from '../../../shared/utils/validators';

interface GoalPlanResult {
  requiredBudgets: Record<string, number>;
  totalRequiredBudget: number;
  expectedROAS: number;
  confidenceScore: number;
  recommendations: Array<{ text: string; priority: 'high' | 'medium' | 'low' }>;
}

const CHANNEL_COLORS: Record<string, string> = {
  'Google Ads': '#4285F4',
  'Meta Ads': '#E4405F',
  'Microsoft Ads': '#00A4EF',
};

function parseFormattedNumber(s: string): number {
  return parseFloat(s.replace(/[^0-9.\-]/g, '')) || 0;
}

function FormattedInput({ value, onChange, prefix, className, min, step }: {
  value: number;
  onChange: (v: number) => void;
  prefix?: string;
  className?: string;
  min?: number;
  step?: number;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  const display = editing ? draft : (prefix || '') + value.toLocaleString('en-US');

  return (
    <div className="relative">
      <input
        type="text"
        inputMode="numeric"
        value={display}
        onFocus={() => { setEditing(true); setDraft(String(value)); }}
        onBlur={(e) => {
          setEditing(false);
          const parsed = parseFormattedNumber(e.target.value);
          const clamped = min != null ? Math.max(min, parsed) : parsed;
          onChange(clamped);
        }}
        onChange={(e) => setDraft(e.target.value.replace(/[^0-9.\-]/g, ''))}
        className={`${className || ''} pl-4`}
        style={{ fontVariantNumeric: 'tabular-nums' }}
      />
    </div>
  );
}

export default function GoalPlannerPage({ embedded }: { embedded?: boolean } = {}) {
  const [targetRevenue, setTargetRevenue] = useState<number>(500000);
  const [days, setDays] = useState<number>(30);
  const [currentBudgets, setCurrentBudgets] = useState<Record<string, number>>({
    'Google Ads': 50000,
    'Meta Ads': 30000,
    'Microsoft Ads': 20000,
  });
  const [result, setResult] = useState<GoalPlanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePlanGoal = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await goalPlannerApi.plan(targetRevenue, days, currentBudgets);
      setResult(response.data.data);
    } catch (err: any) {
      setError(err?.message || 'Failed to generate goal plan. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [targetRevenue, days, currentBudgets]);

  const barData = result
    ? Object.entries(result.requiredBudgets || {}).map(([channel, budget]) => ({
        channel,
        budget,
        current: currentBudgets[channel] || 0,
      }))
    : [];

  const maxBarValue = barData.length > 0 ? Math.max(...barData.map((d) => Math.max(d.budget, d.current))) : 1;

  return (
    <div className={embedded ? '' : 'min-h-screen pt-24'}>
      <div className={embedded ? '' : 'mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'}>
        {!embedded && (
          <div className="mb-8">
            <div className="mb-2">
              <BackButton />
            </div>
            <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Goal Planner</h1>
            <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>Set a revenue target and discover the budget needed to reach it</p>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
          <div className="space-y-6">
            <GlassCard title="Goal Configuration">
              <div className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    Target Revenue
                  </label>
                  <FormattedInput
                    value={targetRevenue}
                    onChange={setTargetRevenue}
                    prefix="$"
                    className="w-full py-2.5"
                    min={0}
                    step={10000}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    Time Period (days)
                  </label>
                  <input
                    type="number"
                    value={days}
                    onChange={(e) => setDays(parseInt(e.target.value) || 1)}
                    className="w-full py-2.5 px-4"
                    min={1}
                    max={365}
                  />
                  <div className="mt-1 flex justify-between text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    <span>1 day</span>
                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{days} days</span>
                    <span>365 days</span>
                  </div>
                </div>

                <div className="border-t pt-4" style={{ borderColor: 'var(--border)' }}>
                  <p className="mb-3 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Current Budgets</p>
                  {VALID_CHANNELS.map((channel) => (
                    <div key={channel} className="mb-3">
                      <label className="mb-1 block text-xs" style={{ color: 'var(--text-tertiary)' }}>{channel}</label>
                      <FormattedInput
                        value={currentBudgets[channel] || 0}
                        onChange={(v) => setCurrentBudgets((prev) => ({ ...prev, [channel]: v }))}
                        prefix="$"
                        className="w-full py-2 text-sm"
                        min={0}
                        step={1000}
                      />
                    </div>
                  ))}
                </div>

                <button
                  onClick={handlePlanGoal}
                  disabled={loading}
                  className="btn-primary w-full"
                >
                  {loading ? 'Planning...' : 'Plan Goal'}
                </button>
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
                <LoadingSpinner text="Calculating optimal budget allocation..." />
              </GlassCard>
            )}

            {result && (
              <>
                <div className="grid gap-4 sm:grid-cols-3">
                  <MetricCard
                    title="Total Required Budget"
                    value={formatCurrency(result.totalRequiredBudget)}
                    subtitle={`Over ${days} days`}
                  />
                  <MetricCard
                    title="Expected ROAS"
                    value={`${result.expectedROAS.toFixed(2)}x`}
                    subtitle="Projected return"
                    delta={result.expectedROAS > 1 ? { text: 'Profitable', isPositive: true } : undefined}
                  />
                  <MetricCard
                    title="Confidence Score"
                    value={`${result.confidenceScore}%`}
                    subtitle="Plan reliability"
                  />
                </div>

                <GlassCard title="Required Budget by Channel" badge="AI Recommended">
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barData} layout="vertical" margin={{ left: 20, right: 20, top: 5, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(200,168,107,0.08)" horizontal={false} />
                        <XAxis type="number" tickFormatter={(v) => formatCurrency(v)} tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }} />
                        <YAxis dataKey="channel" type="category" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} width={110} />
                        <Tooltip
                          contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)' }}
                          formatter={(value: number) => [formatCurrency(value), '']}
                          labelStyle={{ color: 'var(--text-secondary)' }}
                        />
                        <Bar dataKey="current" name="Current" radius={[0, 4, 4, 0]} barSize={16} opacity={0.35}>
                          {barData.map((entry, index) => (
                            <Cell key={`current-${index}`} fill={CHANNEL_COLORS[entry.channel] || 'var(--text-tertiary)'} />
                          ))}
                        </Bar>
                        <Bar dataKey="budget" name="Required" radius={[0, 4, 4, 0]} barSize={16}>
                          {barData.map((entry, index) => (
                            <Cell key={`required-${index}`} fill={CHANNEL_COLORS[entry.channel] || 'var(--accent)'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ opacity: 0.35, background: 'var(--accent)' }} />
                      Current
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: 'var(--accent)' }} />
                      Required
                    </span>
                  </div>
                </GlassCard>

                <GlassCard title="Budget Breakdown">
                  <div className="space-y-3">
                    {barData.map((item) => {
                      const increase = item.current > 0 ? ((item.budget - item.current) / item.current) * 100 : 0;
                      return (
                        <div key={item.channel}>
                          <div className="mb-1.5 flex items-center justify-between text-sm">
                            <span style={{ color: 'var(--text-secondary)' }}>{item.channel}</span>
                            <div className="flex items-center gap-3 text-xs">
                              <span style={{ color: 'var(--text-tertiary)' }}>Current: {formatCurrency(item.current)}</span>
                              <span style={{ color: 'var(--accent)' }}>Required: {formatCurrency(item.budget)}</span>
                              <span className={classNames('font-medium', increase > 0 ? 'trend-up' : increase < 0 ? 'trend-down' : '')}>
                                {increase > 0 ? '+' : ''}{increase.toFixed(0)}%
                              </span>
                            </div>
                          </div>
                          <div className="relative h-2.5 overflow-hidden rounded-full" style={{ background: 'var(--bg-hover)' }}>
                            <div
                              className="absolute left-0 top-0 h-full rounded-full"
                              style={{ width: `${(item.current / maxBarValue) * 100}%`, background: 'var(--text-tertiary)', opacity: 0.3 }}
                            />
                            <div
                              className="absolute left-0 top-0 h-full rounded-full transition-all duration-700"
                              style={{ width: `${(item.budget / maxBarValue) * 100}%`, background: CHANNEL_COLORS[item.channel] || 'var(--accent)' }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </GlassCard>

                {result.recommendations && result.recommendations.length > 0 && (
                  <GlassCard title="Recommendations" badge="AI">
                    <div className="space-y-3">
                      {result.recommendations.map((rec, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-3 rounded-lg p-3"
                          style={{ background: 'var(--bg-hover)' }}
                        >
                          <span
                            className={classNames(
                              'mt-0.5 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold',
                            )}
                            style={{
                              background: rec.priority === 'high' ? 'var(--accent-glow)' : rec.priority === 'medium' ? 'rgba(200,168,107,0.12)' : 'rgba(122,112,96,0.12)',
                              color: rec.priority === 'high' ? 'var(--accent)' : rec.priority === 'medium' ? 'var(--text-secondary)' : 'var(--text-tertiary)',
                            }}
                          >
                            {rec.priority}
                          </span>
                          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{rec.text}</p>
                        </div>
                      ))}
                    </div>
                  </GlassCard>
                )}
              </>
            )}

            {!loading && !result && !error && (
              <GlassCard>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full" style={{ background: 'var(--bg-hover)' }}>
                    <svg className="h-8 w-8" style={{ color: 'var(--text-tertiary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                    </svg>
                  </div>
                  <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                    Configure your revenue goal and click "Plan Goal" to see the required budget allocation.
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
