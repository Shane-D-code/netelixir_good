import React, { useState } from 'react';
import GlassCard from './GlassCard';
import { AIInsights } from '../../types';
import LoadingSpinner from './LoadingSpinner';

interface AIInsightsPanelProps {
  insights: AIInsights | null;
  isLoading?: boolean;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h4
      className="mb-2 text-sm font-semibold uppercase tracking-wider"
      style={{ color: 'var(--text-tertiary, #7A7060)' }}
    >
      {children}
    </h4>
  );
}

function RiskIcon() {
  return (
    <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor" style={{ color: '#F59E0B' }}>
      <path
        fillRule="evenodd"
        d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5.75a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5a.75.75 0 01.75-.75zm0 9a1 1 0 100-2 1 1 0 000 2z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export default function AIInsightsPanel({ insights, isLoading }: AIInsightsPanelProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getAllInsightsText = (): string => {
    if (!insights) return '';
    const parts: string[] = [];
    if (insights.executive_summary) parts.push(`Executive Summary:\n${insights.executive_summary}`);
    if (insights.top_risks?.length) parts.push(`Top Risks:\n${insights.top_risks.map(r => `- ${r}`).join('\n')}`);
    if (insights.budget_recommendations?.length) {
      parts.push(`Budget Recommendations:\n${insights.budget_recommendations.map(r => `- ${r.channel}: $${r.current.toLocaleString()} → $${r.recommended.toLocaleString()} (${r.reason})`).join('\n')}`);
    }
    if (insights.operational_insights) parts.push(`Operational Insights:\n${insights.operational_insights}`);
    if (insights.confidence_assessment) {
      parts.push(`Confidence Assessment:\n${Object.entries(insights.confidence_assessment).map(([k, v]) => `- ${k.replace(/_/g, ' ')}: ${v}`).join('\n')}`);
    }
    return parts.join('\n\n');
  };

  if (isLoading) {
    return (
      <GlassCard className="min-h-[200px]">
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="md" text="Analyzing insights..." />
        </div>
      </GlassCard>
    );
  }

  if (!insights) {
    return (
      <GlassCard className="min-h-[200px]">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <svg
            className="mb-3 h-10 w-10"
            style={{ color: 'var(--text-tertiary, #7A7060)' }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z"
            />
          </svg>
          <p className="text-sm font-medium" style={{ color: 'var(--text-secondary, #B8B0A0)' }}>
            No AI insights available
          </p>
          <p className="mt-1 text-xs" style={{ color: 'var(--text-tertiary, #7A7060)' }}>
            Run a forecast to generate insights
          </p>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard title="AI Insights" badge="ML">
      <div className="space-y-6">
        <div className="flex justify-end">
          <button
            onClick={() => copyToClipboard(getAllInsightsText())}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
            style={{
              background: copied ? 'rgba(34, 197, 94, 0.1)' : 'var(--bg-hover)',
              color: copied ? '#22c55e' : 'var(--text-tertiary)',
              border: '1px solid var(--border)',
            }}
          >
            {copied ? (
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        {/* Executive Summary */}
        {insights.executive_summary && (
          <div
            className="rounded-xl p-4"
            style={{
              borderLeft: '3px solid var(--accent, #C8A86B)',
              backgroundColor: 'rgba(200, 168, 107, 0.05)',
            }}
          >
            <SectionTitle>Executive Summary</SectionTitle>
            <p
              className="text-sm leading-relaxed"
              style={{ color: 'var(--text-primary, #F5F0E8)' }}
            >
              {insights.executive_summary}
            </p>
          </div>
        )}

        {/* Top Risks */}
        {insights.top_risks?.length > 0 && (
          <div>
            <SectionTitle>Top Risks</SectionTitle>
            <div className="space-y-2">
              {insights.top_risks.map((risk, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors"
                  style={{
                    backgroundColor: 'rgba(245, 158, 11, 0.06)',
                    border: '1px solid rgba(245, 158, 11, 0.12)',
                  }}
                >
                  <RiskIcon />
                  <p className="text-sm" style={{ color: 'var(--text-secondary, #B8B0A0)' }}>
                    {risk}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Budget Recommendations */}
        {insights.budget_recommendations?.length > 0 && (
          <div>
            <SectionTitle>Budget Recommendations</SectionTitle>
            <div className="grid gap-3 sm:grid-cols-2">
              {insights.budget_recommendations.map((rec, i) => (
                <div
                  key={i}
                  className="rounded-xl p-4 transition-colors"
                  style={{
                    backgroundColor: 'var(--bg-secondary, rgba(255,255,255,0.03))',
                    border: '1px solid var(--border, rgba(200,168,107,0.12))',
                  }}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span
                      className="text-sm font-semibold"
                      style={{ color: 'var(--text-primary, #F5F0E8)' }}
                    >
                      {rec.channel}
                    </span>
                    <span
                      className="rounded-full px-2 py-0.5 text-xs font-medium"
                      style={{
                        backgroundColor: 'rgba(200, 168, 107, 0.12)',
                        color: 'var(--accent, #C8A86B)',
                      }}
                    >
                      {((rec.recommended - rec.current) / rec.current * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex gap-4 text-xs" style={{ color: 'var(--text-tertiary, #7A7060)' }}>
                    <span>Current: ${rec.current.toLocaleString()}</span>
                    <span>→</span>
                    <span style={{ color: 'var(--accent, #C8A86B)' }}>
                      ${rec.recommended.toLocaleString()}
                    </span>
                  </div>
                  {rec.reason && (
                    <p className="mt-2 text-xs leading-relaxed" style={{ color: 'var(--text-tertiary, #7A7060)' }}>
                      {rec.reason}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Operational Insights */}
        {insights.operational_insights && (
          <div>
            <SectionTitle>Operational Insights</SectionTitle>
            <p
              className="text-sm leading-relaxed"
              style={{ color: 'var(--text-secondary, #B8B0A0)' }}
            >
              {insights.operational_insights}
            </p>
          </div>
        )}

        {/* Confidence Assessment */}
        {insights.confidence_assessment && (
          <div>
            <SectionTitle>Confidence Assessment</SectionTitle>
            <div
              className="grid grid-cols-2 gap-3 rounded-xl p-4 sm:grid-cols-4"
              style={{
                backgroundColor: 'var(--bg-secondary, rgba(255,255,255,0.03))',
                border: '1px solid var(--border, rgba(200,168,107,0.12))',
              }}
            >
              {Object.entries(insights.confidence_assessment).map(([key, value]) => (
                <div key={key} className="text-center">
                  <p
                    className="mb-1 text-xs uppercase tracking-wider"
                    style={{ color: 'var(--text-tertiary, #7A7060)' }}
                  >
                    {key.replace(/_/g, ' ')}
                  </p>
                  <p
                    className="text-sm font-semibold capitalize"
                    style={{ color: 'var(--text-primary, #F5F0E8)' }}
                  >
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </GlassCard>
  );
}
