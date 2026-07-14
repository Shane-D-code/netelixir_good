import React, { useState, useCallback } from 'react';
import GlassCard from '../../../shared/components/ui/GlassCard';
import MetricCard from '../../../shared/components/ui/MetricCard';
import LoadingSpinner from '../../../shared/components/ui/LoadingSpinner';
import BackButton from '../../../shared/components/ui/BackButton';
import { creativeFatigueApi } from '../../../services/feature-services';
import { classNames } from '../../../shared/utils/formatters';

interface Creative {
  name: string;
  channel: string;
  fatigue_score: number;
  performance_trend: 'up' | 'down' | 'stable';
  days_until_critical: number;
  recommended_action: 'refresh' | 'pause' | 'maintain';
}

interface FatigueResult {
  creatives: Creative[];
  total_creatives: number;
  at_risk_count: number;
  critical_count: number;
  average_fatigue_score: number;
}

const ACTION_CONFIG = {
  refresh: { label: 'Refresh', bg: 'rgba(251,191,36,0.12)', color: '#FBBF24', border: 'rgba(251,191,36,0.25)' },
  pause: { label: 'Pause', bg: 'rgba(248,113,113,0.12)', color: '#F87171', border: 'rgba(248,113,113,0.25)' },
  maintain: { label: 'Maintain', bg: 'rgba(52,211,153,0.12)', color: '#34D399', border: 'rgba(52,211,153,0.25)' },
};

function ProgressBar({ value, max = 100 }: { value: number; max?: number }) {
  const pct = Math.min(100, (value / max) * 100);
  const color = pct >= 80 ? '#F87171' : pct >= 50 ? '#FBBF24' : '#34D399';

  return (
    <div className="flex items-center gap-3">
      <div className="h-2 flex-1 overflow-hidden rounded-full" style={{ background: 'var(--bg-hover)' }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="text-xs font-semibold" style={{ color, minWidth: 32, textAlign: 'right' }}>
        {value}
      </span>
    </div>
  );
}

function TrendIcon({ trend }: { trend: 'up' | 'down' | 'stable' }) {
  const config = {
    up: { icon: '↑', color: '#34D399', label: 'Improving' },
    down: { icon: '↓', color: '#F87171', label: 'Declining' },
    stable: { icon: '→', color: 'var(--text-tertiary)', label: 'Stable' },
  };
  const c = config[trend];

  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium" style={{ color: c.color }}>
      {c.icon} {c.label}
    </span>
  );
}

function ActionBadge({ action }: { action: 'refresh' | 'pause' | 'maintain' }) {
  const config = ACTION_CONFIG[action];
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize"
      style={{ background: config.bg, color: config.color, border: `1px solid ${config.border}` }}
    >
      {config.label}
    </span>
  );
}

const DEMO_CREATIVES: Creative[] = [
  { name: 'Summer Sale Hero Banner', channel: 'Google Ads', fatigue_score: 82, performance_trend: 'down', days_until_critical: 3, recommended_action: 'refresh' },
  { name: 'Product Launch Carousel', channel: 'Meta Ads', fatigue_score: 45, performance_trend: 'stable', days_until_critical: 18, recommended_action: 'maintain' },
  { name: 'Retargeting Video Ad', channel: 'Meta Ads', fatigue_score: 91, performance_trend: 'down', days_until_critical: 1, recommended_action: 'pause' },
  { name: 'Brand Awareness Display', channel: 'Microsoft Ads', fatigue_score: 28, performance_trend: 'up', days_until_critical: 42, recommended_action: 'maintain' },
  { name: 'Holiday Promo Text Ad', channel: 'Google Ads', fatigue_score: 67, performance_trend: 'down', days_until_critical: 7, recommended_action: 'refresh' },
  { name: 'Lookalike Audience Ad', channel: 'Meta Ads', fatigue_score: 15, performance_trend: 'up', days_until_critical: 60, recommended_action: 'maintain' },
  { name: 'Shopping Campaign Feed', channel: 'Google Ads', fatigue_score: 73, performance_trend: 'down', days_until_critical: 5, recommended_action: 'refresh' },
  { name: 'LinkedIn Audience Net', channel: 'Microsoft Ads', fatigue_score: 55, performance_trend: 'stable', days_until_critical: 12, recommended_action: 'maintain' },
];

export default function CreativeFatiguePage() {
  const [result, setResult] = useState<FatigueResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDetect = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await creativeFatigueApi.detect(DEMO_CREATIVES);
      setResult(response.data);
    } catch (err: any) {
      setError(err?.message || 'Detection failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const displayResult = result || {
    creatives: DEMO_CREATIVES,
    total_creatives: DEMO_CREATIVES.length,
    at_risk_count: DEMO_CREATIVES.filter((c) => c.fatigue_score >= 50 && c.fatigue_score < 80).length,
    critical_count: DEMO_CREATIVES.filter((c) => c.fatigue_score >= 80).length,
    average_fatigue_score: Math.round(DEMO_CREATIVES.reduce((a, c) => a + c.fatigue_score, 0) / DEMO_CREATIVES.length),
  };

  return (
    <div className="min-h-screen pt-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="mb-2">
            <BackButton />
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Creative Fatigue Detector</h1>
              <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>Identify underperforming creatives before they waste budget</p>
            </div>
            <button
              onClick={handleDetect}
              disabled={loading}
              className="btn-primary flex items-center gap-2 self-start"
            >
              {loading ? (
                <>
                  <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                  Analyzing...
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                  Detect Fatigue
                </>
              )}
            </button>
          </div>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total Creatives"
            value={String(displayResult.total_creatives)}
            subtitle="Across all channels"
          />
          <MetricCard
            title="At Risk"
            value={String(displayResult.at_risk_count)}
            subtitle="Fatigue score 50-79"
            delta={displayResult.at_risk_count > 0 ? { text: 'Needs attention', isPositive: false } : { text: 'All clear', isPositive: true }}
          />
          <MetricCard
            title="Critical"
            value={String(displayResult.critical_count)}
            subtitle="Fatigue score 80+"
            delta={displayResult.critical_count > 0 ? { text: 'Action required', isPositive: false } : { text: 'All clear', isPositive: true }}
          />
          <MetricCard
            title="Avg. Fatigue Score"
            value={String(displayResult.average_fatigue_score)}
            subtitle="Portfolio average"
          />
        </div>

        {loading && (
          <GlassCard>
            <LoadingSpinner text="Analyzing creative performance data..." />
          </GlassCard>
        )}

        {error && (
          <div className="mb-6 rounded-lg p-4 text-sm" style={{ border: '1px solid var(--accent-soft-glow)', background: 'var(--accent-glow)', color: 'var(--accent)' }}>
            {error}
          </div>
        )}

        <GlassCard title="Creative Performance" badge={`${displayResult.total_creatives} creatives`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                  <th className="px-4 py-3 font-medium">Creative Name</th>
                  <th className="px-4 py-3 font-medium">Channel</th>
                  <th className="px-4 py-3 font-medium min-w-[180px]">Fatigue Score</th>
                  <th className="px-4 py-3 font-medium">Trend</th>
                  <th className="px-4 py-3 font-medium text-center">Days Until Critical</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {displayResult.creatives
                  .sort((a, b) => b.fatigue_score - a.fatigue_score)
                  .map((creative, i) => (
                    <tr
                      key={i}
                      className="border-b transition-colors"
                      style={{ borderColor: 'var(--border-divider)' }}
                    >
                      <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>
                        {creative.name}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                          style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)' }}
                        >
                          {creative.channel}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <ProgressBar value={creative.fatigue_score} />
                      </td>
                      <td className="px-4 py-3">
                        <TrendIcon trend={creative.performance_trend} />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={classNames(
                            'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold',
                          )}
                          style={{
                            background: creative.days_until_critical <= 5
                              ? 'rgba(248,113,113,0.12)'
                              : creative.days_until_critical <= 14
                                ? 'rgba(251,191,36,0.12)'
                                : 'rgba(52,211,153,0.12)',
                            color: creative.days_until_critical <= 5
                              ? '#F87171'
                              : creative.days_until_critical <= 14
                                ? '#FBBF24'
                                : '#34D399',
                          }}
                        >
                          {creative.days_until_critical}d
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <ActionBadge action={creative.recommended_action} />
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </GlassCard>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <GlassCard title="Fatigue Distribution">
            <div className="space-y-3">
              {[
                { label: 'Healthy (0-49)', count: displayResult.creatives.filter((c) => c.fatigue_score < 50).length, color: '#34D399' },
                { label: 'At Risk (50-79)', count: displayResult.creatives.filter((c) => c.fatigue_score >= 50 && c.fatigue_score < 80).length, color: '#FBBF24' },
                { label: 'Critical (80-100)', count: displayResult.creatives.filter((c) => c.fatigue_score >= 80).length, color: '#F87171' },
              ].map((segment) => (
                <div key={segment.label}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span style={{ color: 'var(--text-secondary)' }}>{segment.label}</span>
                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{segment.count}</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full" style={{ background: 'var(--bg-hover)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${displayResult.creatives.length > 0 ? (segment.count / displayResult.creatives.length) * 100 : 0}%`,
                        background: segment.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard title="Channel Breakdown">
            <div className="space-y-3">
              {Array.from(new Set(displayResult.creatives.map((c) => c.channel))).map((channel) => {
                const channelCreatives = displayResult.creatives.filter((c) => c.channel === channel);
                const avgFatigue = Math.round(channelCreatives.reduce((a, c) => a + c.fatigue_score, 0) / channelCreatives.length);
                return (
                  <div key={channel}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span style={{ color: 'var(--text-secondary)' }}>{channel}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{channelCreatives.length} creatives</span>
                        <span className="font-medium" style={{ color: avgFatigue >= 80 ? '#F87171' : avgFatigue >= 50 ? '#FBBF24' : '#34D399' }}>
                          Avg: {avgFatigue}
                        </span>
                      </div>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full" style={{ background: 'var(--bg-hover)' }}>
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${avgFatigue}%`,
                          background: avgFatigue >= 80 ? '#F87171' : avgFatigue >= 50 ? '#FBBF24' : '#34D399',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
