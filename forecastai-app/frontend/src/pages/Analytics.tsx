import React, { useState } from 'react';
import GlassCard from '../components/common/GlassCard';
import MetricCard from '../components/common/MetricCard';
import CampaignPieChart from '../components/charts/CampaignPieChart';
import ForecastChart from '../components/charts/ForecastChart';
import RiskDistributionChart from '../components/charts/RiskDistributionChart';
import BackButton from '../components/common/BackButton';
import { useForecastStore } from '../store/forecastStore';
import { formatCurrency, formatROAS, classNames } from '../utils/formatters';

const TABS = [
  'Channel Metrics',
  'Forecast Accuracy',
  'Anomaly Detection',
  'Causal Analysis',
  'Campaign Decomposition',
  'Risk Metrics',
];

export default function Analytics() {
  const [activeTab, setActiveTab] = useState(0);
  const forecastResult = useForecastStore((s) => s.forecastResult);
  const result = forecastResult;

  const renderTabContent = () => {
    switch (activeTab) {
      case 0:
        return renderChannelMetrics();
      case 1:
        return renderForecastAccuracy();
      case 2:
        return renderAnomalyDetection();
      case 3:
        return renderCausalAnalysis();
      case 4:
        return renderCampaignDecomposition();
      case 5:
        return renderRiskMetrics();
      default:
        return null;
    }
  };

  const renderChannelMetrics = () => (
    <div className="space-y-6">
      <GlassCard title="Channel Performance Metrics">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
                <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                  <th className="px-4 py-3 font-medium">Channel</th>
                  <th className="px-4 py-3 font-medium">Total Revenue</th>
                  <th className="px-4 py-3 font-medium">Daily Avg</th>
                  <th className="px-4 py-3 font-medium">Std Dev</th>
                  <th className="px-4 py-3 font-medium">CV</th>
                  <th className="px-4 py-3 font-medium">Trend</th>
                  <th className="px-4 py-3 font-medium">ROAS</th>
              </tr>
            </thead>
            <tbody>
              {result?.channel_metrics ? (
                Object.entries(result.channel_metrics).map(([channel, metrics]) => (
                  <tr key={channel} className="border-b" style={{ borderColor: 'var(--border-divider)' }}>
                    <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>{channel}</td>
                    <td className="px-4 py-3">{formatCurrency(metrics.total_revenue)}</td>
                    <td className="px-4 py-3">{formatCurrency(metrics.daily_avg_revenue)}</td>
                    <td className="px-4 py-3">{formatCurrency(metrics.std_revenue)}</td>
                    <td className="px-4 py-3">{(metrics.cv * 100).toFixed(1)}%</td>
                    <td className={classNames('px-4 py-3', metrics.trend >= 0 ? 'trend-up' : 'trend-down')}>
                      {metrics.trend >= 0 ? '+' : ''}{(metrics.trend * 100).toFixed(1)}%
                    </td>
                    <td className="px-4 py-3">{formatROAS(metrics.roas)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center" style={{ color: 'var(--text-tertiary)' }}>
                    No channel metrics available. Generate a forecast first.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {result?.channel_forecasts && (
        <GlassCard title="Channel Performance Comparison">
          <div className="h-[350px]">
            <ForecastChart data="total" channelForecasts={result.channel_forecasts} height={300} />
          </div>
        </GlassCard>
      )}
    </div>
  );

  const renderForecastAccuracy = () => (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="MAPE"
          value={result?.backtest_metrics ? `${result.backtest_metrics.mape.toFixed(1)}%` : 'N/A'}
          subtitle="Mean Absolute Percentage Error"
          delta={result?.backtest_metrics && result.backtest_metrics.mape < 10
            ? { text: 'Excellent', isPositive: true }
            : undefined
          }
        />
        <MetricCard
          title="RMSE"
          value={result?.backtest_metrics ? formatCurrency(result.backtest_metrics.rmse) : 'N/A'}
          subtitle="Root Mean Square Error"
        />
        <MetricCard
          title="R² Score"
          value={result?.backtest_metrics ? result.backtest_metrics.r2.toFixed(2) : 'N/A'}
          subtitle="Coefficient of determination"
          delta={result?.backtest_metrics && result.backtest_metrics.r2 > 0.8
            ? { text: 'Strong fit', isPositive: true }
            : undefined
          }
        />
        <MetricCard
          title="Coverage (90%)"
          value={result?.backtest_metrics ? `${result.backtest_metrics.coverage_90.toFixed(1)}%` : 'N/A'}
          subtitle="P10-P90 interval coverage"
        />
      </div>

      {result?.channel_forecasts && (
        <GlassCard title="Actual vs Forecast">
          <div className="h-[350px]">
            <ForecastChart data="total" channelForecasts={result.channel_forecasts} height={300} />
          </div>
        </GlassCard>
      )}

      {result?.backtest_metrics?.fold_metrics && result.backtest_metrics.fold_metrics.length > 0 && (
        <GlassCard title="Cross-Validation Results">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                  <th className="px-4 py-3 font-medium">Fold</th>
                  <th className="px-4 py-3 font-medium">MAPE (%)</th>
                  <th className="px-4 py-3 font-medium">RMSE</th>
                </tr>
              </thead>
              <tbody>
                {result.backtest_metrics.fold_metrics.map((fold) => (
                  <tr key={fold.fold} className="border-b" style={{ borderColor: 'var(--border-divider)' }}>
                    <td className="px-4 py-3">Fold {fold.fold}</td>
                    <td className="px-4 py-3">{fold.mape.toFixed(2)}%</td>
                    <td className="px-4 py-3">{formatCurrency(fold.rmse)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}
    </div>
  );

  const renderAnomalyDetection = () => (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          title="Total Anomalies"
          value={String(result?.anomalies?.length || 0)}
          subtitle="Detected events"
        />
        <MetricCard
          title="High Severity"
          value={String(result?.anomalies?.filter((a) => a.severity === 'high').length || 0)}
          subtitle="Requires attention"
        />
        <MetricCard
          title="Channels Affected"
          value={String(new Set(result?.anomalies?.map((a) => a.channel) || []).size || 0)}
          subtitle="With anomalies"
        />
      </div>

      <div className="space-y-4">
        {result?.anomalies && result.anomalies.length > 0 ? (
          result.anomalies.slice(0, 10).map((anomaly, i) => (
            <div
              key={i}
              className={classNames(
                'rounded-lg border p-4',
                anomaly.severity === 'high' ? '' : ''
              )}
              style={anomaly.severity === 'high' ? { borderColor: 'var(--accent-soft-glow)', background: 'var(--accent-glow)' } : { borderColor: 'var(--border)', background: 'transparent' }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={classNames('h-2 w-2 rounded-full', anomaly.severity === 'high' ? '' : '')}
                      style={anomaly.severity === 'high' ? { background: 'var(--accent)' } : { background: 'var(--text-tertiary)' }}
                    />
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{anomaly.channel}</span>
                    <span style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>{anomaly.date}</span>
                  </div>
                  <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>{anomaly.cause}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Actual: <span style={{ color: 'var(--accent)' }}>{formatCurrency(anomaly.actual_revenue)}</span>
                  </p>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Expected: <span style={{ color: 'var(--text-primary)' }}>{formatCurrency(anomaly.expected_revenue)}</span>
                  </p>
                  <p style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>z-score: {anomaly.zscore.toFixed(2)}</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-lg p-8 text-center" style={{ background: 'var(--bg-hover)' }}>
            <p style={{ color: 'var(--text-tertiary)' }}>No anomalies detected</p>
            <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
              {!result ? 'Generate a forecast to enable anomaly detection.' : 'All channels operating within normal parameters.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );

  const renderCausalAnalysis = () => (
    <div className="space-y-6">
      {result?.causal_drivers && result.causal_drivers.length > 0 ? (
        <>
          <GlassCard title="Revenue Driver Importance">
            <div className="space-y-4">
              {result.causal_drivers.map((driver, i) => (
                <div key={i}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span style={{ color: 'var(--text-secondary)' }}>{driver.driver}</span>
                    <div className="flex items-center gap-3">
                      <span className={classNames('text-xs font-medium', driver.direction === 'positive' ? 'trend-up' : 'trend-down')}>
                        {driver.direction === 'positive' ? '↑ Positive' : '↓ Negative'}
                      </span>
                      <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{driver.importance}%</span>
                    </div>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full" style={{ background: 'var(--bg-hover)' }}>
                    <div
                      className={classNames('h-full rounded-full transition-all duration-1000')}
                      style={{ width: `${driver.importance}%`, background: driver.direction === 'positive' ? 'linear-gradient(to right, var(--accent), var(--accent-soft))' : 'linear-gradient(to right, var(--accent), transparent)' }}
                    />
                  </div>
                  <p className="mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>{driver.description}</p>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard title="Causal Analysis" badge="AI">
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Analysis identifies <span style={{ color: 'var(--text-primary)' }}>{result.causal_drivers[0]?.driver}</span> as the primary
              revenue driver with <span style={{ color: 'var(--text-primary)' }}>{result.causal_drivers[0]?.importance}%</span> relative
              importance. Channel-level analysis reveals that Google Ads and Meta Ads contribute the majority of
              revenue, with Meta Ads showing higher elasticity to budget changes. Weekends show
              {result.causal_drivers.some((d) => d.driver.includes('Weekend') && d.direction === 'positive')
                ? ' elevated '
                : ' reduced '}
              performance compared to weekdays.
            </p>
          </GlassCard>
        </>
      ) : (
        <div className="rounded-lg p-8 text-center" style={{ background: 'var(--bg-hover)' }}>
          <p style={{ color: 'var(--text-tertiary)' }}>No causal analysis data available</p>
          <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>Generate a forecast with causal inference enabled.</p>
        </div>
      )}
    </div>
  );

  const renderCampaignDecomposition = () => (
    <div className="space-y-6">
      {result?.campaign_analysis ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <GlassCard title="Campaign Type Distribution">
            <CampaignPieChart data={result.campaign_analysis.campaign_types} />
          </GlassCard>
          <div className="space-y-6">
            <GlassCard title="Campaign Breakdown">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                      <th className="px-4 py-3 font-medium">Type</th>
                      <th className="px-4 py-3 font-medium">Revenue</th>
                      <th className="px-4 py-3 font-medium">Share</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(result.campaign_analysis.campaign_types)
                      .filter(([, v]) => v > 0)
                      .sort(([, a], [, b]) => b - a)
                      .map(([type, revenue]) => {
                        const total = Object.values(result.campaign_analysis!.campaign_types).reduce((a, b) => a + b, 0);
                        return (
                          <tr key={type} className="border-b" style={{ borderColor: 'var(--border-divider)' }}>
                            <td className="px-4 py-3">{type}</td>
                            <td className="px-4 py-3">{formatCurrency(revenue)}</td>
                            <td className="px-4 py-3">{total > 0 ? ((revenue / total) * 100).toFixed(0) : 0}%</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </GlassCard>

            <GlassCard title="Top Campaigns">
              <div className="space-y-3">
                {result.campaign_analysis.top_campaigns.map((camp, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg p-3" style={{ background: 'var(--bg-hover)' }}>
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold" style={{ background: 'var(--accent-glow)', color: 'var(--accent)' }}>
                        {i + 1}
                      </span>
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{camp.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{formatCurrency(camp.revenue)}</span>
                      <span className="ml-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>ROAS: {formatROAS(camp.roas)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        </div>
      ) : (
        <div className="rounded-lg p-8 text-center" style={{ background: 'var(--bg-hover)' }}>
          <p style={{ color: 'var(--text-tertiary)' }}>No campaign decomposition data available</p>
          <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>Generate a forecast with campaign decomposition enabled.</p>
        </div>
      )}
    </div>
  );

  const renderRiskMetrics = () => (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="VaR (95%)"
          value={result?.risk_metrics ? formatCurrency(result.risk_metrics.value_at_risk_95) : 'N/A'}
          subtitle="Value at Risk"
        />
        <MetricCard
          title="CVaR (95%)"
          value={result?.risk_metrics ? formatCurrency(result.risk_metrics.conditional_var_95) : 'N/A'}
          subtitle="Conditional VaR"
        />
        <MetricCard
          title="Volatility"
          value={result?.risk_metrics ? `${(result.risk_metrics.volatility * 100).toFixed(1)}%` : 'N/A'}
          subtitle="Revenue volatility"
        />
        <MetricCard
          title="Risk/Reward"
          value={result?.risk_metrics ? result.risk_metrics.risk_reward_ratio.toFixed(2) : 'N/A'}
          subtitle="Ratio"
          delta={result?.risk_metrics && result.risk_metrics.risk_reward_ratio > 1
            ? { text: 'Favorable', isPositive: true }
            : undefined
          }
        />
      </div>

      <GlassCard title="Revenue Distribution" badge="Monte Carlo">
        {result?.total_forecast?.all_simulations && result?.risk_metrics ? (
          <RiskDistributionChart
            allSimulations={result.total_forecast.all_simulations}
            var95={result.risk_metrics.value_at_risk_95}
          />
        ) : (
          <div className="flex h-[300px] items-center justify-center" style={{ color: 'var(--text-tertiary)' }}>
            No simulation data available
          </div>
        )}
      </GlassCard>

      <GlassCard title="Channel Risk Breakdown">
        {result?.risk_metrics?.channel_risk_breakdown ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                  <th className="px-4 py-3 font-medium">Channel</th>
                  <th className="px-4 py-3 font-medium">VaR (95%)</th>
                  <th className="px-4 py-3 font-medium">CVaR (95%)</th>
                  <th className="px-4 py-3 font-medium">Volatility</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(result.risk_metrics.channel_risk_breakdown).map(([channel, risk]) => (
                  <tr key={channel} className="border-b" style={{ borderColor: 'var(--border-divider)' }}>
                    <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>{channel}</td>
                    <td className="px-4 py-3">{formatCurrency(risk.var_95)}</td>
                    <td className="px-4 py-3">{formatCurrency(risk.cvar_95)}</td>
                    <td className="px-4 py-3">{(risk.volatility * 100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>No risk breakdown available</p>
        )}
      </GlassCard>
    </div>
  );

  return (
    <div className="min-h-screen pt-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="mb-2">
            <BackButton />
          </div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Analytics Dashboard</h1>
          <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>Deep dive into forecast performance and metrics</p>
        </div>

        {result?.ai_insights && (
          <GlassCard className="mb-8" title="AI Insights" badge="AI">
            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <p className="mb-2 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Executive Summary</p>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{result.ai_insights.executive_summary}</p>
              </div>
              <div>
                <p className="mb-2 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Confidence Assessment</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'var(--text-secondary)' }}>Overall</span>
                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{result.ai_insights.confidence_assessment.overall}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'var(--text-secondary)' }}>Data Quality</span>
                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{result.ai_insights.confidence_assessment.data_quality}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'var(--text-secondary)' }}>Model Agreement</span>
                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{result.ai_insights.confidence_assessment.model_agreement}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'var(--text-secondary)' }}>Uncertainty</span>
                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{result.ai_insights.confidence_assessment.uncertainty_level}</span>
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
        )}

        <div className="mb-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="MAPE"
              value={result?.backtest_metrics ? `${result.backtest_metrics.mape}%` : 'N/A'}
              subtitle="Forecast error"
            />
            <MetricCard
              title="Best Model"
              value={result?.backtest_metrics ? 'Ensemble' : 'N/A'}
              subtitle="Across all channels"
            />
            <MetricCard
              title="Anomalies"
              value={String(result?.anomalies?.length || 0)}
              subtitle="Detected"
            />
            <MetricCard
              title="Confidence"
              value={result ? `${result.confidence_score}%` : 'N/A'}
              subtitle="Overall score"
            />
          </div>
        </div>

        <div className="tab-list mb-6">
          <div className="flex gap-0 overflow-x-auto">
            {TABS.map((tab, i) => (
              <button
                key={tab}
                onClick={() => setActiveTab(i)}
                className={classNames('tab whitespace-nowrap', activeTab === i && 'active')}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="animate-fade-in">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}
