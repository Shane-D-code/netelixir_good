import React from 'react';
import { useAppStore } from '../store/appStore';
import { useForecastStore } from '../store/forecastStore';
import GlassCard from '../components/common/GlassCard';
import MetricCard from '../components/common/MetricCard';
import ForecastChart from '../components/charts/ForecastChart';
import ChannelBreakdownChart from '../components/charts/ChannelBreakdownChart';
import { formatCurrency } from '../utils/formatters';

const CLIENTS = [
  'Nike', 'Adidas', 'Unilever', "L'Oreal", 'Samsung', 'Uber', 'Spotify',
];

export default function Dashboard() {
  const setCurrentPage = useAppStore((s) => s.setCurrentPage);
  const forecastResult = useForecastStore((s) => s.forecastResult);

  return (
    <div className="min-h-screen space-y-12 pt-24">
      <section className="relative overflow-hidden">
        <div className="jellyfish-glow absolute inset-0" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative grid items-center gap-12 lg:grid-cols-2">
            <div className="space-y-8">
              <div className="hero-badge inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ background: 'var(--accent)', animation: 'pulse 2s ease-in-out infinite' }} />
                <span>AI-Powered Intelligence</span>
              </div>
              <h1 className="hero-title text-4xl sm:text-5xl lg:text-6xl">
                Forecast with{' '}
                <span style={{ background: 'linear-gradient(to right, var(--text-primary), var(--accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Precision
                </span>
              </h1>
              <p className="hero-description max-w-xl">
                Enterprise-grade probabilistic forecasting powered by ensemble machine learning.
                Predict revenue across Google Ads, Meta Ads, and Microsoft Ads with confidence.
              </p>
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => setCurrentPage('forecast')}
                  className="btn-primary"
                >
                  Generate Forecast
                </button>
                <button
                  onClick={() => setCurrentPage('analytics')}
                  className="btn-secondary"
                >
                  View Analytics
                </button>
              </div>
            </div>

            <div className="relative flex items-center justify-center">
              <div className="relative h-80 w-80">
                <div className="absolute inset-0 rounded-full blur-3xl" style={{ background: 'var(--accent-glow)', animation: 'pulse 3s ease-in-out infinite' }} />
                <div className="absolute inset-4 animate-float rounded-full border" style={{ borderColor: 'var(--accent-soft-glow)', background: 'linear-gradient(to bottom right, var(--accent-soft-glow), transparent)' }} />
                <div className="absolute inset-16 rounded-full border" style={{ borderColor: 'rgba(20, 20, 20, 0.1)', background: 'var(--accent-glow)' }} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-5xl font-bold" style={{ color: 'var(--text-primary)' }}>
                      {forecastResult ? formatCurrency(forecastResult.p50_revenue) : '$3.2M'}
                    </p>
                    <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>Forecasted Revenue</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { value: '$3.2M+', label: 'Revenue Forecasted', sub: 'Across all channels' },
            { value: '95%', label: 'Forecast Accuracy', sub: 'MAPE < 5%' },
            { value: '8.8x', label: 'Avg. ROAS', sub: 'Portfolio-wide' },
          ].map((stat) => (
            <GlassCard key={stat.label}>
              <p className="text-3xl font-bold" style={{ background: 'linear-gradient(to right, var(--text-primary), var(--accent-light))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {stat.value}
              </p>
              <p className="mt-1 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{stat.label}</p>
              <p style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>{stat.sub}</p>
            </GlassCard>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <blockquote className="text-xl font-medium leading-relaxed italic" style={{ color: 'var(--text-secondary)' }}>
            "ForecastAI transformed how we allocate our marketing budget. The ensemble model's accuracy
            reduced our forecasting errors by{' '}
            <span className="not-italic" style={{ color: 'var(--accent-soft)' }}>60%</span> in the first quarter."
          </blockquote>
          <p className="mt-4 text-sm" style={{ color: 'var(--text-tertiary)' }}>— Head of Marketing, Fortune 500 E-commerce</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <GlassCard title="Real-Time Intelligence" badge="4x faster">
            <p className="mb-4 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Process millions of data points in seconds with our optimized ensemble pipeline.
              Four models working in concert for maximum accuracy.
            </p>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Processing Speed', value: '< 2s' },
                { label: 'Models Active', value: '4' },
                { label: 'Data Points', value: '10K+' },
                { label: 'Accuracy', value: '95%' },
              ].map((item) => (
                <div key={item.label} className="dark-card">
                  <p className="text-lg font-semibold">{item.value}</p>
                  <p className="label">{item.label}</p>
                </div>
              ))}
            </div>
          </GlassCard>

          <div className="space-y-6">
            <GlassCard title="120+" badge="Deployments">
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Enterprise installations worldwide</p>
            </GlassCard>
            <GlassCard>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ background: 'var(--bg-hover)' }}>
                  <svg className="h-5 w-5" style={{ color: 'var(--text-tertiary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>SOC 2 Compliant</p>
                  <p style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>Enterprise security standards</p>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
        <p className="clients-title mb-8 text-center">
          Trusted by industry leaders
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8">
          {CLIENTS.map((client) => (
            <div key={client} className="logo-item flex h-10 items-center rounded-lg px-6 text-sm font-bold tracking-wider">
              {client}
            </div>
          ))}
        </div>
      </section>

      {forecastResult && (
        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Forecast Overview</h2>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>Latest forecast results</p>
          </div>

          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="P50 Revenue"
              value={formatCurrency(forecastResult.p50_revenue)}
              subtitle="Median forecast"
              gradient
            />
            <MetricCard
              title="Return on Ad Spend"
              value={`${forecastResult.roas.toFixed(2)}x`}
              subtitle="Portfolio ROAS"
              delta={{ text: '+12% vs last period', isPositive: true }}
              gradient
            />
            <MetricCard
              title="Confidence Score"
              value={`${forecastResult.confidence_score}%`}
              subtitle="Model agreement"
              gradient
            />
            <MetricCard
              title="Processing Time"
              value={`${(forecastResult.processing_time / 1000).toFixed(1)}s`}
              subtitle="End-to-end"
              gradient
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {forecastResult.channel_forecasts && (
              <GlassCard title="Forecast Trend" badge="P10-P90">
                <div className="h-[350px]">
                  <ForecastChart
                    data="total"
                    channelForecasts={forecastResult.channel_forecasts}
                    height={300}
                  />
                </div>
              </GlassCard>
            )}
            <div className="space-y-6">
              {forecastResult.total_forecast?.channel_breakdown && (
                <GlassCard title="Channel Breakdown">
                  <ChannelBreakdownChart data={forecastResult.total_forecast.channel_breakdown} />
                </GlassCard>
              )}
              <GlassCard title="Ensemble Weights">
                <div className="space-y-3">
                  {Object.entries(forecastResult.model_weights)
                    .sort(([, a], [, b]) => b - a)
                    .map(([model, weight]) => (
                      <div key={model}>
                        <div className="mb-1 flex items-center justify-between text-sm">
                          <span className="capitalize" style={{ color: 'var(--text-secondary)' }}>{model.replace('_', ' ')}</span>
                          <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{(weight * 100).toFixed(0)}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full" style={{ background: 'var(--bg-hover)' }}>
                          <div
                            className="h-full rounded-full transition-all duration-1000"
                            style={{ width: `${weight * 100}%`, background: 'linear-gradient(to right, var(--accent), var(--accent-soft))' }}
                          />
                        </div>
                      </div>
                    ))}
                </div>
              </GlassCard>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
