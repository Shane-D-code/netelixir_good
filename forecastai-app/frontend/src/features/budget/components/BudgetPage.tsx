import React, { useState } from 'react';
import GlassCard from '../../../shared/components/ui/GlassCard';
import MetricCard from '../../../shared/components/ui/MetricCard';
import CampaignPieChart from '../../../shared/components/charts/CampaignPieChart';
import ElasticityCurveChart from '../../../shared/components/charts/ElasticityCurveChart';
import BackButton from '../../../shared/components/ui/BackButton';
import { useForecastStore } from '../../forecast/store/forecast.store';
import { useSimulateBudget, useOptimizeBudget } from '../../forecast/hooks/useForecast';
import { formatCurrency, formatROAS, classNames } from '../../../shared/utils/formatters';
import { VALID_CHANNELS } from '../../../shared/utils/validators';
import { useQuery } from '@tanstack/react-query';
import { budgetAPI } from '../../forecast/services/forecast.service';

export default function Budget() {
  const forecastResult = useForecastStore((s) => s.forecastResult);
  const budgets = useForecastStore((s) => s.budgets);
  const simulationResult = useForecastStore((s) => s.simulationResult);
  const optimizationResult = useForecastStore((s) => s.optimizationResult);
  const setSimulationResult = useForecastStore((s) => s.setSimulationResult);
  const setOptimizationResult = useForecastStore((s) => s.setOptimizationResult);

  const [selectedChannel, setSelectedChannel] = useState('Google Ads');
  const [budgetChange, setBudgetChange] = useState(0);
  const [activeTab, setActiveTab] = useState<'allocation' | 'scenario' | 'elasticity'>('allocation');

  const simulateMutation = useSimulateBudget();
  const optimizeMutation = useOptimizeBudget();

  const totalBudget = Object.values(budgets).reduce((a, b) => a + b, 0);
  const baseRevenue = forecastResult?.p50_revenue || 500000;

  const budgetPieData: Record<string, number> = {};
  for (const ch of VALID_CHANNELS) {
    budgetPieData[ch] = budgets[ch] || 0;
  }

  const { data: elasticityData } = useQuery({
    queryKey: ['elasticity', selectedChannel, budgets, baseRevenue],
    queryFn: () => budgetAPI.getElasticity(selectedChannel, budgets, baseRevenue),
    enabled: activeTab === 'elasticity',
    staleTime: 30000,
  });

  const marginalROIs = VALID_CHANNELS.map((ch) => {
    const budget = budgets[ch] || 1;
    const chRevenue = forecastResult?.channel_metrics?.[ch]?.total_revenue || baseRevenue / 3;
    const roas = chRevenue / budget;
    return { channel: ch, roas, marginalRoas: roas * (ch === 'Meta Ads' ? 0.9 : ch === 'Google Ads' ? 0.7 : 0.6) };
  });

  const handleSimulate = () => {
    const currentBudgets = { ...budgets };
    simulateMutation.mutate(
      {
        channel: selectedChannel,
        percentage_change: budgetChange,
        current_budgets: currentBudgets,
        base_revenue: baseRevenue,
      },
      {
        onSuccess: (data) => setSimulationResult(data),
      }
    );
  };

  const handleOptimize = () => {
    const historicalRoas: Record<string, number> = {};
    for (const ch of VALID_CHANNELS) {
      const chRevenue = forecastResult?.channel_metrics?.[ch]?.total_revenue || baseRevenue / 3;
      historicalRoas[ch] = chRevenue / (budgets[ch] || 1);
    }
    optimizeMutation.mutate({
      current_budgets: budgets,
      total_budget: totalBudget,
      historical_roas: historicalRoas,
    });
  };

  return (
    <div className="min-h-screen pt-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="mb-2">
            <BackButton />
          </div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Budget Optimizer</h1>
          <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>Optimize channel allocation for maximum ROI</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 mb-8">
          <MetricCard
            title="Total Budget"
            value={formatCurrency(totalBudget)}
            subtitle="Across all channels"
          />
          <MetricCard
            title="Projected Revenue"
            value={formatCurrency(baseRevenue)}
            subtitle={`${forecastResult ? 'From forecast' : 'Estimated'}`}
          />
          <MetricCard
            title="Portfolio ROAS"
            value={baseRevenue > 0 && totalBudget > 0 ? formatROAS(baseRevenue / totalBudget) : 'N/A'}
            subtitle="Current efficiency"
          />
        </div>

        <div className="tab-list mb-6 flex gap-2">
          {(['allocation', 'scenario', 'elasticity'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={classNames('tab', activeTab === tab && 'active')}
            >
              {tab === 'allocation' ? 'Current Allocation' : tab === 'scenario' ? 'What-If Scenarios' : 'Elasticity Curves'}
            </button>
          ))}
        </div>

        {activeTab === 'allocation' && (
          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <GlassCard title="Budget Distribution">
                <CampaignPieChart data={budgetPieData} />
              </GlassCard>
              <GlassCard title="Budget vs Projected Revenue">
                <div className="space-y-4">
                  {VALID_CHANNELS.map((ch) => {
                    const budget = budgets[ch] || 0;
                    const rev = forecastResult?.channel_metrics?.[ch]?.total_revenue || baseRevenue / 3;
                    const maxVal = Math.max(totalBudget, baseRevenue);
                    return (
                      <div key={ch}>
                        <div className="mb-1 flex items-center justify-between text-sm">
                          <span style={{ color: 'var(--text-secondary)' }}>{ch}</span>
                          <div className="flex gap-3">
                            <span style={{ color: 'var(--accent)' }}>Budget: {formatCurrency(budget)}</span>
                            <span style={{ color: 'var(--text-secondary)' }}>Rev: {formatCurrency(rev)}</span>
                          </div>
                        </div>
                        <div className="relative h-4 overflow-hidden rounded-full" style={{ background: 'var(--bg-hover)' }}>
                          <div
                            className="absolute left-0 top-0 h-full rounded-full transition-all"
                            style={{ width: `${(budget / Math.max(1, maxVal)) * 100}%`, background: 'var(--accent-soft)' }}
                          />
                          <div
                            className="absolute left-0 top-0 h-full rounded-full transition-all"
                            style={{ width: `${(rev / Math.max(1, maxVal)) * 100}%`, background: 'var(--accent-glow)' }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </GlassCard>
            </div>

            <GlassCard title="Marginal ROI Analysis">
              <div className="space-y-4">
                {marginalROIs.map(({ channel, roas, marginalRoas }) => {
                  const maxRoas = Math.max(...marginalROIs.map((r) => r.roas));
                  return (
                    <div key={channel}>
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{channel}</span>
                        <div className="flex gap-4 text-xs" style={{ color: 'var(--text-secondary)' }}>
                          <span>ROAS: {formatROAS(roas)}</span>
                          <span>Marginal: {formatROAS(marginalRoas)}</span>
                        </div>
                      </div>
                      <div className="h-3 overflow-hidden rounded-full" style={{ background: 'var(--bg-hover)' }}>
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${(roas / maxRoas) * 100}%`, background: 'linear-gradient(to right, var(--accent), var(--accent-soft))' }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </GlassCard>

            <div className="flex justify-center">
              <button
                onClick={handleOptimize}
                disabled={optimizeMutation.isPending}
                className="btn-primary"
              >
                {optimizeMutation.isPending ? 'Optimizing...' : 'Run Optimization'}
              </button>
            </div>

            {optimizationResult && (
              <GlassCard title="Optimal Allocation" badge="AI Recommended">
                <div className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <MetricCard
                      title="Revenue Increase"
                      value={`+${optimizationResult.expected_revenue_increase}%`}
                      subtitle="Expected improvement"
                    />
                    <MetricCard
                      title="ROAS Improvement"
                      value={`${optimizationResult.expected_roas_improvement > 0 ? '+' : ''}${optimizationResult.expected_roas_improvement.toFixed(2)}x`}
                      subtitle={optimizationResult.expected_roas_improvement > 0 ? 'Positive' : 'Neutral'}
                    />
                    <MetricCard
                      title="Additional Profit"
                      value={formatCurrency(optimizationResult.expected_additional_profit)}
                      subtitle="Expected gain"
                    />
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                          <th className="px-4 py-3 font-medium">Channel</th>
                          <th className="px-4 py-3 font-medium">Current</th>
                          <th className="px-4 py-3 font-medium">Optimal</th>
                          <th className="px-4 py-3 font-medium">Change</th>
                          <th className="px-4 py-3 font-medium">Impact</th>
                        </tr>
                      </thead>
                      <tbody>
                        {optimizationResult.channel_adjustments.map((adj) => (
                          <tr key={adj.channel} className="border-b" style={{ borderColor: 'var(--border-divider)' }}>
                            <td className="px-4 py-3">{adj.channel}</td>
                            <td className="px-4 py-3">{formatCurrency(adj.current)}</td>
                            <td className="px-4 py-3">{formatCurrency(adj.optimal)}</td>
                            <td className={classNames('px-4 py-3', adj.change_percent >= 0 ? '' : 'trend-down')}>
                              {adj.change_percent >= 0 ? '+' : ''}{adj.change_percent.toFixed(0)}%
                            </td>
                            <td className="px-4 py-3">{adj.expected_impact}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </GlassCard>
            )}
          </div>
        )}

        {activeTab === 'scenario' && (
          <div className="space-y-6">
            <GlassCard title="What-If Scenario Simulator">
              <div className="space-y-6">
                <div>
                  <label className="mb-2 block text-sm" style={{ color: 'var(--text-secondary)' }}>Channel</label>
                  <div className="flex gap-2">
                    {VALID_CHANNELS.map((ch) => (
                      <button
                        key={ch}
                        onClick={() => setSelectedChannel(ch)}
                        className={classNames(
                          'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                          selectedChannel === ch
                            ? 'btn-primary'
                            : 'btn-secondary'
                        )}
                      >
                        {ch}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Budget Change: {budgetChange > 0 ? '+' : ''}{budgetChange}%
                  </label>
                  <input
                    type="range"
                    min={-50}
                    max={100}
                    value={budgetChange}
                    onChange={(e) => setBudgetChange(parseInt(e.target.value))}
                    className="w-full"
                    style={{ accentColor: 'var(--accent)' }}
                  />
                  <div className="mt-1 flex justify-between text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    <span>-50%</span>
                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{budgetChange}%</span>
                    <span>+100%</span>
                  </div>
                </div>
                <button
                  onClick={handleSimulate}
                  disabled={simulateMutation.isPending}
                  className="btn-primary w-full"
                >
                  {simulateMutation.isPending ? 'Simulating...' : 'Run Simulation'}
                </button>
              </div>
            </GlassCard>

            {simulationResult && (
              <GlassCard title="Scenario Results">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-3">
                    <div className="flex justify-between border-b pb-2 text-sm" style={{ borderColor: 'var(--border-divider)' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Current Budget</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{formatCurrency(simulationResult.current_budget)}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2 text-sm" style={{ borderColor: 'var(--border-divider)' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>New Budget</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{formatCurrency(simulationResult.new_budget)}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2 text-sm" style={{ borderColor: 'var(--border-divider)' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Current Revenue</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{formatCurrency(simulationResult.current_revenue)}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2 text-sm" style={{ borderColor: 'var(--border-divider)' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>New Revenue</span>
                      <span className={simulationResult.impact === 'positive' ? '' : 'trend-down'}>
                        {formatCurrency(simulationResult.new_revenue)}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between border-b pb-2 text-sm" style={{ borderColor: 'var(--border-divider)' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Current ROAS</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{formatROAS(simulationResult.current_roas)}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2 text-sm" style={{ borderColor: 'var(--border-divider)' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>New ROAS</span>
                      <span className={simulationResult.impact === 'positive' ? '' : 'trend-down'}>
                        {formatROAS(simulationResult.new_roas)}
                      </span>
                    </div>
                    <div className="flex justify-between border-b pb-2 text-sm" style={{ borderColor: 'var(--border-divider)' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Incremental Revenue</span>
                      <span className={simulationResult.incremental_revenue >= 0 ? 'trend-up' : 'trend-down'}>
                        {simulationResult.incremental_revenue >= 0 ? '+' : ''}{formatCurrency(simulationResult.incremental_revenue)}
                      </span>
                    </div>
                    <div className="flex justify-between border-b pb-2 text-sm" style={{ borderColor: 'var(--border-divider)' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Impact</span>
                      <span className={simulationResult.impact === 'positive' ? 'trend-up' : simulationResult.impact === 'negative' ? 'trend-down' : ''}>
                        {simulationResult.impact.charAt(0).toUpperCase() + simulationResult.impact.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>
              </GlassCard>
            )}

            {!forecastResult && (
              <div className="rounded-lg p-4 text-sm" style={{ border: '1px solid var(--accent-soft-glow)', background: 'var(--accent-glow)', color: 'var(--accent)' }}>
                Generate a forecast first to enable budget simulations with your actual data.
              </div>
            )}
          </div>
        )}

        {activeTab === 'elasticity' && (
          <div className="space-y-6">
            <div className="flex gap-2 mb-4">
              {VALID_CHANNELS.map((ch) => (
                <button
                  key={ch}
                  onClick={() => setSelectedChannel(ch)}
                  className={classNames(
                    'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                    selectedChannel === ch
                      ? 'btn-primary'
                      : 'btn-secondary'
                  )}
                >
                  {ch}
                </button>
              ))}
            </div>

            <GlassCard
              title={`${selectedChannel} Elasticity Curve`}
              badge={`ε = ${elasticityData?.elasticity.toFixed(2) ?? (selectedChannel === 'Meta Ads' ? '0.9' : selectedChannel === 'Google Ads' ? '0.7' : '0.6')}`}
            >
              {elasticityData ? (
                <ElasticityCurveChart data={elasticityData} />
              ) : (
                <div className="flex h-[300px] items-center justify-center" style={{ color: 'var(--text-tertiary)' }}>
                  Loading elasticity data...
                </div>
              )}
            </GlassCard>

            <GlassCard title="AI Budget Insights" badge="AI">
              <div className="space-y-4">
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  Based on historical elasticity analysis, <span style={{ color: 'var(--accent)' }}>{selectedChannel}</span> shows
                  {' '}<span style={{ color: 'var(--text-primary)' }}>{elasticityData && elasticityData.elasticity > 0.8 ? 'high' : 'moderate'}</span> responsiveness to budget changes.
                  {elasticityData && elasticityData.elasticity > 0.8
                    ? ' Consider increasing allocation as returns remain strong at higher spend levels.'
                    : ' Current allocation is near optimal for this channel.'}
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="dark-card">
                    <p className="label">Current Budget</p>
                    <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{formatCurrency(budgets[selectedChannel] || 0)}</p>
                  </div>
                  <div className="dark-card">
                    <p className="label">Optimal Multiplier</p>
                    <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {elasticityData ? `${elasticityData.optimal_multiplier.toFixed(1)}x` : '1.0x'}
                    </p>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>
        )}
      </div>
    </div>
  );
}
