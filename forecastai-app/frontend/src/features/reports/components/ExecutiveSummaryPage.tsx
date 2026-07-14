import React, { useState, useCallback } from 'react';
import DOMPurify from 'dompurify';
import GlassCard from '../../../shared/components/ui/GlassCard';
import LoadingSpinner from '../../../shared/components/ui/LoadingSpinner';
import BackButton from '../../../shared/components/ui/BackButton';
import Button from '../../../shared/components/ui/Button';
import { reportApi } from '../../../services/feature-services';
import { useForecastStore } from '../../forecast/store/forecast.store';
import { classNames } from '../../../shared/utils/formatters';
import type { ExecutiveSummaryResult } from '../../../shared/types/features';

const TEMPLATES = ['Minimal', 'Detailed', 'Executive'] as const;

const SECTIONS = [
  { id: 'forecast_overview', label: 'Forecast Overview' },
  { id: 'channel_performance', label: 'Channel Performance' },
  { id: 'risk_analysis', label: 'Risk Analysis' },
  { id: 'budget_recommendations', label: 'Budget Recommendations' },
  { id: 'anomalies', label: 'Anomalies' },
  { id: 'campaign_insights', label: 'Campaign Insights' },
] as const;

export default function ExecutiveSummaryPage() {
  const forecastResult = useForecastStore((s) => s.forecastResult);

  const [clientName, setClientName] = useState('');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [template, setTemplate] = useState<string>('Detailed');
  const [enabledSections, setEnabledSections] = useState<Record<string, boolean>>({
    forecast_overview: true,
    channel_performance: true,
    risk_analysis: true,
    budget_recommendations: true,
    anomalies: false,
    campaign_insights: false,
  });

  const [result, setResult] = useState<ExecutiveSummaryResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleSection = (id: string) => {
    setEnabledSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    setError(null);
    setResult(null);
    try {
      const params = {
        clientName,
        startDate,
        endDate,
        template: template.toLowerCase(),
        sections: Object.entries(enabledSections)
          .filter(([, enabled]) => enabled)
          .map(([id]) => id),
        forecastResult,
      };
      const res = await reportApi.generate(params);
      setResult(res.data.data || res.data);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Report generation failed.');
    } finally {
      setIsGenerating(false);
    }
  }, [clientName, startDate, endDate, template, enabledSections, forecastResult]);

  const handleDownload = useCallback(() => {
    window.print();
  }, []);

  const handleSaveTemplate = useCallback(() => {
    const config = { template, enabledSections, clientName };
    localStorage.setItem('report_template_config', JSON.stringify(config));
  }, [template, enabledSections, clientName]);

  return (
    <div className="min-h-screen pt-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="mb-2">
            <BackButton />
          </div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Executive Summary</h1>
          <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
            Generate polished, client-ready performance reports
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            <GlassCard title="Report Configuration">
              <div className="space-y-5">
                <div>
                  <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Client Name</label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="e.g. Acme Corp"
                    className="w-full rounded-lg px-4 py-2.5 text-sm"
                    style={{
                      background: 'var(--bg-hover)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border)',
                    }}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full rounded-lg px-4 py-2.5 text-sm"
                      style={{
                        background: 'var(--bg-hover)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border)',
                      }}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full rounded-lg px-4 py-2.5 text-sm"
                      style={{
                        background: 'var(--bg-hover)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border)',
                      }}
                    />
                  </div>
                </div>
              </div>
            </GlassCard>

            <GlassCard title="Template">
              <div className="grid grid-cols-3 gap-3">
                {TEMPLATES.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTemplate(t)}
                    className={classNames(
                      'rounded-xl border p-4 text-center transition-all duration-200',
                      template === t ? 'ring-2' : 'hover:scale-[1.02]'
                    )}
                    style={{
                      borderColor: template === t ? 'var(--accent)' : 'var(--border)',
                      background: template === t ? 'var(--accent-glow)' : 'var(--bg-hover)',
                      boxShadow: template === t ? '0 0 20px rgba(200,168,107,0.15)' : 'none',
                      ...(template === t ? { '--tw-ring-color': 'var(--accent)' } as React.CSSProperties : {}),
                    }}
                  >
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{t}</p>
                    <p className="mt-1 text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                      {t === 'Minimal' ? 'Key metrics only' : t === 'Detailed' ? 'Full breakdown' : 'Board-ready'}
                    </p>
                  </button>
                ))}
              </div>
            </GlassCard>

            <GlassCard title="Include Sections">
              <div className="space-y-2">
                {SECTIONS.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => toggleSection(section.id)}
                    className="flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors duration-150"
                    style={{
                      background: enabledSections[section.id] ? 'var(--accent-glow)' : 'transparent',
                      border: 'none',
                    }}
                  >
                    <div
                      className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded"
                      style={{
                        background: enabledSections[section.id] ? 'var(--accent)' : 'var(--bg-hover)',
                        border: enabledSections[section.id] ? 'none' : '1px solid var(--border)',
                      }}
                    >
                      {enabledSections[section.id] && (
                        <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{section.label}</span>
                  </button>
                ))}
              </div>
            </GlassCard>

            <div className="flex justify-end">
              <Button
                onClick={handleGenerate}
                loading={isGenerating}
                disabled={isGenerating}
                size="lg"
              >
                Generate Report
              </Button>
            </div>
          </div>

          <div className="space-y-6 lg:sticky lg:top-28 lg:self-start">
            <GlassCard title="Report Preview" badge={result?.template?.toUpperCase()}>
              {isGenerating && (
                <div className="py-12">
                  <LoadingSpinner size="md" text="Generating report..." />
                </div>
              )}

              {error && !isGenerating && (
                <div className="py-8 text-center">
                  <div
                    className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full"
                    style={{ background: '#DC262615' }}
                  >
                    <svg className="h-6 w-6" style={{ color: '#DC2626' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <p className="text-sm" style={{ color: '#DC2626' }}>{error}</p>
                </div>
              )}

              {!result && !isGenerating && !error && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full" style={{ background: 'var(--bg-hover)' }}>
                    <svg className="h-8 w-8" style={{ color: 'var(--text-tertiary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    Configure your report and click <span style={{ color: 'var(--accent)' }}>Generate Report</span>
                  </p>
                </div>
              )}

              {result && !isGenerating && (
                <div className="space-y-6">
                  <div
                    className="report-preview rounded-lg overflow-hidden"
                    style={{
                      background: 'var(--bg-hover)',
                      maxHeight: '600px',
                      overflowY: 'auto',
                    }}
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(result.html) }}
                  />

                  {result.sections && result.sections.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase" style={{ color: 'var(--text-tertiary)' }}>Sections</p>
                      <div className="space-y-2">
                        {result.sections.map((section, i) => (
                          <div key={i} className="rounded-lg p-3" style={{ background: 'var(--bg-hover)' }}>
                            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{section.title}</p>
                            <p className="mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>{section.type}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-3">
                    <Button onClick={handleDownload} variant="secondary" size="sm">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Download PDF
                    </Button>
                    <Button onClick={handleSaveTemplate} variant="ghost" size="sm">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                      Save as Template
                    </Button>
                  </div>
                </div>
              )}
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
}
