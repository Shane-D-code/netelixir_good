import React, { useState } from 'react';
import GlassCard from '../../../shared/components/ui/GlassCard';
import MetricCard from '../../../shared/components/ui/MetricCard';
import CSVUploader from './CSVUploader';
import ForecastChart from '../../../shared/components/charts/ForecastChart';
import ChannelBreakdownChart from '../../../shared/components/charts/ChannelBreakdownChart';
import LoadingSpinner from '../../../shared/components/ui/LoadingSpinner';
import BackButton from '../../../shared/components/ui/BackButton';
import { useForecastStore } from '../store/forecast.store';
import { useGenerateForecast } from '../hooks/useForecast';
import { forecastAPI } from '../services/forecast.service';
import { formatCurrency, formatROAS, classNames } from '../../../shared/utils/formatters';
import { VALID_CHANNELS } from '../../../shared/utils/validators';

const STEPS = ['Upload Data', 'Set Budgets', 'Configure', 'Results'];

export default function Forecast() {
  const [step, setStep] = useState(0);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStatus, setGenerationStatus] = useState('');
  const [showOverview, setShowOverview] = useState(false);
  const store = useForecastStore();
  const generateMutation = useGenerateForecast();

  const hasUpload = !!store.uploadPreview;
  const hasResult = !!store.forecastResult;
  const totalBudget = Object.values(store.budgets).reduce((a, b) => a + b, 0);

  const handleGenerate = async () => {
    const file = store.uploadedFile;
    if (!file) return;
    store.setForecastResult(null);
    setGenerationProgress(0);
    setGenerationStatus('Starting...');
    const enhanced = store.enableEnhanced;
    generateMutation.mutate({
      file,
      params: {
        channel_budgets: store.budgets,
        forecast_days: store.forecastDays,
        confidence_level: store.confidenceLevel,
        n_simulations: store.nSimulations,
        enable_enhanced: enhanced,
        enable_ai_insights: enhanced,
        enable_caching: enhanced,
        enable_anomaly_detection: enhanced,
        enable_causal_inference: enhanced,
        enable_campaign_decomposition: enhanced,
        enable_risk_metrics: enhanced,
      },
      onProgress: (progress, status) => {
        setGenerationProgress(progress);
        setGenerationStatus(status);
      },
    });
  };

  const updateBudget = (channel: string, value: number) => {
    store.setBudgets({ ...store.budgets, [channel]: value });
  };

  const renderUploadStep = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: 'var(--accent-glow)' }}>
          <span className="text-lg font-bold" style={{ color: 'var(--accent)' }}>1</span>
        </div>
          <div>
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Upload Historical Data</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>CSV with date, revenue, and channel columns</p>
        </div>
      </div>
      <CSVUploader />
      {hasUpload && (
        <div className="flex justify-end">
          <button onClick={() => setStep(1)} className="btn-primary">
            Next: Set Budgets
          </button>
        </div>
      )}
    </div>
  );

  const renderBudgetStep = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: 'var(--accent-glow)' }}>
          <span className="text-lg font-bold" style={{ color: 'var(--accent)' }}>2</span>
        </div>
          <div>
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Set Channel Budgets</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Define your marketing spend per channel</p>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {VALID_CHANNELS.map((channel) => (
          <GlassCard key={channel}>
            <label className="mb-2 block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{channel}</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }}>$</span>
              <input
                type="number"
                value={store.budgets[channel]}
                onChange={(e) => updateBudget(channel, parseFloat(e.target.value) || 0)}
                className="w-full py-2.5 pl-8 pr-4"
                min={0}
                step={1000}
              />
            </div>
          </GlassCard>
        ))}
      </div>
      <div className="flex items-center justify-between rounded-lg p-4" style={{ background: 'var(--bg-hover)' }}>
        <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Total Budget</span>
        <span className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{formatCurrency(totalBudget)}</span>
      </div>
      <div className="flex justify-between">
        <button onClick={() => setStep(0)} className="btn-ghost">Back</button>
        <button onClick={() => setStep(2)} className="btn-primary">
          Next: Configure
        </button>
      </div>
    </div>
  );

  const renderConfigStep = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: 'var(--accent-glow)' }}>
          <span className="text-lg font-bold" style={{ color: 'var(--accent)' }}>3</span>
        </div>
          <div>
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Forecast Configuration</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Fine-tune your forecast parameters</p>
        </div>
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <GlassCard>
          <label className="mb-2 block text-sm" style={{ color: 'var(--text-secondary)' }}>Forecast Horizon</label>
          <input
            type="range"
            min={7}
            max={365}
            value={store.forecastDays}
            onChange={(e) => store.setForecastDays(parseInt(e.target.value))}
            className="w-full"
            style={{ accentColor: 'var(--accent)' }}
          />
          <div className="mt-1 flex justify-between" style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
            <span>7 days</span>
            <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{store.forecastDays} days</span>
            <span>365 days</span>
          </div>
        </GlassCard>
        <GlassCard>
          <label className="mb-2 block text-sm" style={{ color: 'var(--text-secondary)' }}>Confidence Level</label>
          <input
            type="range"
            min={50}
            max={99}
            value={Math.round(store.confidenceLevel * 100)}
            onChange={(e) => store.setConfidenceLevel(parseInt(e.target.value) / 100)}
            className="w-full"
            style={{ accentColor: 'var(--accent)' }}
          />
          <div className="mt-1 flex justify-between" style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
            <span>50%</span>
            <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{(store.confidenceLevel * 100).toFixed(0)}%</span>
            <span>99%</span>
          </div>
        </GlassCard>
        <GlassCard>
          <label className="mb-2 block text-sm" style={{ color: 'var(--text-secondary)' }}>Monte Carlo Simulations</label>
          <input
            type="range"
            min={100}
            max={5000}
            step={100}
            value={store.nSimulations}
            onChange={(e) => store.setNSimulations(parseInt(e.target.value))}
            className="w-full"
            style={{ accentColor: 'var(--accent)' }}
          />
          <div className="mt-1 flex justify-between" style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
            <span>100</span>
            <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{store.nSimulations.toLocaleString()}</span>
            <span>5,000</span>
          </div>
        </GlassCard>
        <GlassCard>
          <label className="mb-2 block text-sm" style={{ color: 'var(--text-secondary)' }}>Enhanced Mode</label>
          <div className="flex items-center justify-between">
            <p style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>Advanced features, holiday detection, promotion analysis</p>
            <button
              onClick={() => store.setEnableEnhanced(!store.enableEnhanced)}
              className={classNames(
                'relative h-6 w-11 rounded-full transition-colors',
                store.enableEnhanced ? 'bg-dark-100' : 'bg-white/10'
              )}
            >
              <span
                className={classNames(
                  'absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform',
                  store.enableEnhanced ? 'translate-x-[22px]' : 'translate-x-0.5'
                )}
              />
            </button>
          </div>
        </GlassCard>
      </div>
      <div className="flex justify-between">
        <button onClick={() => setStep(1)} className="btn-ghost">Back</button>
        <button
          onClick={() => {
            setStep(3);
            handleGenerate();
          }}
          disabled={generateMutation.isPending}
          className="btn-primary flex items-center gap-2"
        >
          {generateMutation.isPending ? (
            <>
              <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
              Generating...
            </>
          ) : (
            'Generate Forecast'
          )}
        </button>
      </div>
    </div>
  );

  const renderResultsStep = () => {
    const result = store.forecastResult;

    if (generateMutation.isPending) {
      return (
        <GlassCard>
          <div className="text-center py-8">
            <LoadingSpinner />
            <div className="mt-4">
              <div className="font-medium" style={{ color: 'var(--text-primary)' }}>Generating Forecast</div>
              <div className="text-sm mt-1 capitalize" style={{ color: 'var(--text-secondary)' }}>{generationStatus}</div>
              <div className="mt-4 max-w-md mx-auto">
                <div className="w-full h-2 rounded-full" style={{ background: 'var(--bg-hover)' }}>
                  <div
                    className="h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(generationProgress, 2)}%`, background: 'var(--accent)' }}
                  />
                </div>
                <div className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>{generationProgress}% complete</div>
              </div>
            </div>
            <div className="mt-6">
              <button onClick={() => setStep(2)} className="btn-ghost">Back to configuration</button>
            </div>
          </div>
        </GlassCard>
      );
    }

    if (generateMutation.isError) {
      const errorMessage = generateMutation.error?.message || 'Forecast generation failed';
      return (
        <GlassCard>
            <div className="text-center py-8">
            <div className="text-lg font-semibold" style={{ color: 'var(--error)' }}>Generation Failed</div>
            <div className="text-sm mt-2 max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>{errorMessage}</div>
            <div className="mt-6 flex gap-3 justify-center">
              <button onClick={handleGenerate} className="btn-primary">
                Retry
              </button>
              <button onClick={() => setStep(2)} className="btn-ghost">Adjust Settings</button>
            </div>
          </div>
        </GlassCard>
      );
    }

    if (!result) {
      return (
        <div className="space-y-6">
          <LoadingSpinner text="Running 1,000 simulations..." />
          <div className="flex justify-center">
            <button onClick={() => setStep(2)} className="btn-ghost">Back to configuration</button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: 'var(--bg-hover)' }}>
              <svg className="h-5 w-5" style={{ color: 'var(--text-tertiary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Forecast Complete</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Processed in {(result.processing_time / 1000).toFixed(1)}s</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={async () => {
                if (!result) return;
                try {
                  const blob = await forecastAPI.exportCSV(result.id);
                  const url = window.URL.createObjectURL(new Blob([blob]));
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `forecast_${result.id}.csv`;
                  document.body.appendChild(link);
                  link.click();
                  link.remove();
                  window.URL.revokeObjectURL(url);
                } catch {}
              }}
              className="btn-secondary text-xs"
            >
              Export CSV
            </button>
            <button
              onClick={() => {
                if (!result) return;
                const summary = `Forecast Summary\nP50 Revenue: ${formatCurrency(result.p50_revenue)}\nROAS: ${formatROAS(result.roas)}\nConfidence: ${result.confidence_score}%\nBudget: ${formatCurrency(result.total_budget)}`;
                navigator.clipboard.writeText(summary);
              }}
              className="btn-secondary text-xs"
            >
              Copy Summary
            </button>
          </div>
        </div>

          <div className="flex items-center gap-4 p-3 rounded-lg" style={{ background: 'var(--bg-hover)' }}>
            <div className="flex-1 grid grid-cols-4 gap-4">
              <div>
                <p style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>P50 Revenue</p>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{formatCurrency(result.p50_revenue)}</p>
              </div>
              <div>
                <p style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>ROAS</p>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{formatROAS(result.roas)}</p>
              </div>
              <div>
                <p style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>Confidence</p>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{result.confidence_score}%</p>
              </div>
              <div>
                <p style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>Budget</p>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{formatCurrency(result.total_budget)}</p>
              </div>
            </div>
            <button onClick={() => setShowOverview(true)} className="btn-primary text-xs shrink-0">
            Details
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {result.channel_forecasts && (
            <GlassCard title="Forecast Trend" badge="P10-P90">
              <ForecastChart data="total" channelForecasts={result.channel_forecasts} height={300} />
            </GlassCard>
          )}

          <div className="space-y-6">
            <GlassCard title="Channel Breakdown">
              {result.total_forecast?.channel_breakdown && (
                <ChannelBreakdownChart data={result.total_forecast.channel_breakdown} />
              )}
            </GlassCard>

            {result.model_weights && Object.keys(result.model_weights).length > 0 && (
              <GlassCard title="Model Weights" badge="Adaptive">
                <div className="space-y-3">
                  {Object.entries(result.model_weights)
                    .sort(([, a], [, b]) => b - a)
                    .map(([model, weight]) => (
                      <div key={model}>
                        <div className="mb-1 flex items-center justify-between text-sm">
                          <span style={{ color: 'var(--text-secondary)' }}>{model.replace(/_/g, ' ')}</span>
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
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {result.backtest_metrics && (result.backtest_metrics.n_folds ?? result.backtest_metrics.fold_metrics.length) > 0 && (
            <GlassCard title="Forecast Accuracy" badge="Walk-Forward">
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>MAPE</div>
                  <div className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    {result.backtest_metrics.mape.toFixed(1)}%
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Mean Abs % Error</div>
                </div>
                <div className="text-center">
                  <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>RMSE</div>
                  <div className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    {formatCurrency(result.backtest_metrics.rmse)}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Root Mean Sq Error</div>
                </div>
                <div className="text-center">
                  <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Coverage</div>
                  <div className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    {result.backtest_metrics.coverage_90.toFixed(0)}%
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>90% CI Coverage</div>
                </div>
              </div>
              {result.backtest_metrics.fold_metrics.length > 0 && (
                <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                  <div className="flex items-center justify-between text-xs mb-2" style={{ color: 'var(--text-tertiary)' }}>
                    <span>Validated on {result.backtest_metrics.fold_metrics.length} folds</span>
                    <span
                      style={{
                        color: result.backtest_metrics.mape < 15 ? '#22c55e' : result.backtest_metrics.mape < 30 ? '#F59E0B' : '#EF4444',
                      }}
                    >
                      {result.backtest_metrics.mape < 15 ? 'Good accuracy' : result.backtest_metrics.mape < 30 ? 'Moderate accuracy' : 'Review recommended'}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {result.backtest_metrics.fold_metrics.map((fold) => (
                      <div
                        key={fold.fold}
                        className="flex-1 rounded px-2 py-1 text-center text-xs"
                        style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)' }}
                      >
                        F{fold.fold}: {fold.mape.toFixed(1)}%
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </GlassCard>
          )}

          <GlassCard title="Risk Metrics">
            <div className="grid grid-cols-2 gap-4">
              {result.risk_metrics && (
                <>
                  <div>
                    <p style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>VaR (95%)</p>
                    <p className="text-lg font-semibold" style={{ color: 'var(--accent)' }}>
                      {formatCurrency(result.risk_metrics.value_at_risk_95)}
                    </p>
                  </div>
                  <div>
                    <p style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>CVaR (95%)</p>
                    <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {formatCurrency(result.risk_metrics.conditional_var_95)}
                    </p>
                  </div>
                  <div>
                    <p style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>Volatility</p>
                    <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {(result.risk_metrics.volatility * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>Prob. of Loss</p>
                    <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {(result.risk_metrics.probability_of_loss * 100).toFixed(1)}%
                    </p>
                  </div>
                </>
              )}
            </div>
          </GlassCard>

          {result.ai_insights && (
            <GlassCard title="AI Insights" badge="AI">
              <div className="space-y-4">
                <div>
                  <p className="mb-2 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Executive Summary</p>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {result.ai_insights.executive_summary}
                  </p>
                </div>
                {result.ai_insights.top_risks?.length > 0 && (
                  <div>
                    <p className="mb-2 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Top Risks</p>
                    <ul className="space-y-1">
                      {result.ai_insights.top_risks.map((risk, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                          <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ background: 'var(--accent)' }} />
                          {risk}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {result.ai_insights.seasonal_factors?.length > 0 && (
                  <div>
                    <p className="mb-2 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Seasonal Factors</p>
                    <ul className="space-y-1">
                      {result.ai_insights.seasonal_factors.map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                          <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ background: 'var(--accent)' }} />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </GlassCard>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen pt-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="mb-2">
            <BackButton />
          </div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Forecast Engine</h1>
          <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>Generate probabilistic revenue forecasts</p>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center">
                <div
                  className={classNames(
                    'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors',
                    i <= step ? 'text-white' : ''
                  )}
                  style={i <= step ? { background: 'var(--accent)' } : { background: 'var(--bg-hover)', color: 'var(--text-tertiary)' }}
                >
                  {i + 1}
                </div>
                <span className="ml-2 text-sm hidden sm:inline" style={{ color: 'var(--text-secondary)' }}>
                  {s}
                </span>
                {i < STEPS.length - 1 && (
                  <div className="mx-2 h-px w-8 sm:w-16 md:w-24" style={i < step ? { background: 'var(--accent)' } : { background: 'var(--border)' }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {step === 0 && renderUploadStep()}
        {step === 1 && renderBudgetStep()}
        {step === 2 && renderConfigStep()}
        {step === 3 && renderResultsStep()}
      </div>

      {showOverview && store.forecastResult && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(24px)' }}
          onClick={() => setShowOverview(false)}
        >
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-3xl">
          <GlassCard className="relative w-full">
            <button
              onClick={() => setShowOverview(false)}
              className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full btn-ghost"
            >
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
            <h3 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Forecast Overview</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { title: 'P50 Revenue', value: formatCurrency(store.forecastResult.p50_revenue), sub: 'Median forecast' },
                { title: 'ROAS', value: formatROAS(store.forecastResult.roas), sub: 'Return on ad spend' },
                { title: 'Confidence Score', value: `${store.forecastResult.confidence_score}%`, sub: 'Model agreement' },
                { title: 'Total Budget', value: formatCurrency(store.forecastResult.total_budget), sub: 'All channels' },
              ].map((m) => (
                <MetricCard key={m.title} title={m.title} value={m.value} subtitle={m.sub} />
              ))}
            </div>
            </GlassCard>
          </div>
        </div>
      )}
    </div>
  );
}
