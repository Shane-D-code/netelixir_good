import React, { useState, useCallback, useEffect, useMemo } from 'react';
import GlassCard from '../../../shared/components/ui/GlassCard';
import LoadingSpinner from '../../../shared/components/ui/LoadingSpinner';
import BackButton from '../../../shared/components/ui/BackButton';
import Button from '../../../shared/components/ui/Button';
import { useAlerts } from '../hooks/useAlerts';
import { classNames } from '../../../shared/utils/formatters';

const SEVERITY_CONFIG = {
  critical: { color: '#DC2626', bg: '#DC262615', label: 'Critical' },
  warning: { color: '#E8B84B', bg: '#E8B84B15', label: 'Warning' },
  info: { color: '#3B82F6', bg: '#3B82F615', label: 'Info' },
} as const;

const CHANNEL_OPTIONS = ['All Channels', 'Google Ads', 'Meta Ads', 'Microsoft Ads'];
const DATE_RANGES = ['Last 24h', 'Last 7 days', 'Last 30 days', 'All time'];

export default function AlertsPage() {
  const { alerts, unreadCount, isLoading, fetchAlerts, acknowledge, acknowledgeAll } = useAlerts();
  const [severityFilter, setSeverityFilter] = useState('All');
  const [channelFilter, setChannelFilter] = useState('All Channels');
  const [dateRange, setDateRange] = useState('All time');
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null);

  useEffect(() => {
    const filters: Record<string, string> = {};
    if (severityFilter !== 'All') filters.severity = severityFilter;
    if (channelFilter !== 'All Channels') filters.channel = channelFilter;
    if (dateRange !== 'All time') filters.dateRange = dateRange;
    fetchAlerts(Object.keys(filters).length > 0 ? filters : undefined);
  }, [severityFilter, channelFilter, dateRange, fetchAlerts]);

  const filteredAlerts = useMemo(() => {
    let filtered = alerts;
    if (severityFilter !== 'All') {
      filtered = filtered.filter((a) => a.severity === severityFilter.toLowerCase());
    }
    if (channelFilter !== 'All Channels') {
      filtered = filtered.filter((a) => a.channel === channelFilter);
    }
    return filtered;
  }, [alerts, severityFilter, channelFilter]);

  const counts = useMemo(() => ({
    total: alerts.length,
    critical: alerts.filter((a) => a.severity === 'critical').length,
    warning: alerts.filter((a) => a.severity === 'warning').length,
    info: alerts.filter((a) => a.severity === 'info').length,
  }), [alerts]);

  const unacknowledgedCount = useMemo(
    () => filteredAlerts.filter((a) => !a.acknowledged).length,
    [filteredAlerts]
  );

  const toggleExpand = (id: string) => {
    setExpandedAlert((prev) => (prev === id ? null : id));
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
              <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Alert Intelligence Engine</h1>
              <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
                Real-time monitoring and actionable intelligence
              </p>
            </div>
            {unacknowledgedCount > 0 && (
              <Button
                onClick={acknowledgeAll}
                variant="secondary"
                size="sm"
              >
                Acknowledge All ({unacknowledgedCount})
              </Button>
            )}
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Total', value: counts.total, color: 'var(--text-primary)' },
            { label: 'Critical', value: counts.critical, color: '#DC2626' },
            { label: 'Warning', value: counts.warning, color: '#E8B84B' },
            { label: 'Info', value: counts.info, color: '#3B82F6' },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl border p-4"
              style={{ borderColor: 'var(--border)', background: 'var(--bg-hover)' }}
            >
              <p className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>{item.label}</p>
              <p className="mt-1 text-2xl font-bold" style={{ color: item.color }}>{item.value}</p>
            </div>
          ))}
        </div>

        <GlassCard className="mb-6">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex-1">
              <label className="mb-1.5 block text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>Severity</label>
              <div className="flex gap-2">
                {['All', 'Critical', 'Warning', 'Info'].map((sev) => (
                  <button
                    key={sev}
                    onClick={() => setSeverityFilter(sev)}
                    className={classNames(
                      'rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-all duration-200',
                    )}
                    style={{
                      background: severityFilter === sev
                        ? sev === 'All' ? 'var(--accent)' : `${SEVERITY_CONFIG[sev.toLowerCase() as keyof typeof SEVERITY_CONFIG]?.color}20`
                        : 'var(--bg-hover)',
                      color: severityFilter === sev
                        ? sev === 'All' ? '#fff' : SEVERITY_CONFIG[sev.toLowerCase() as keyof typeof SEVERITY_CONFIG]?.color
                        : 'var(--text-tertiary)',
                      border: 'none',
                    }}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1">
              <label className="mb-1.5 block text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>Channel</label>
              <select
                value={channelFilter}
                onChange={(e) => setChannelFilter(e.target.value)}
                className="w-full rounded-lg px-3 py-1.5 text-xs"
                style={{ background: 'var(--bg-hover)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
              >
                {CHANNEL_OPTIONS.map((ch) => (
                  <option key={ch} value={ch}>{ch}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="mb-1.5 block text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>Date Range</label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full rounded-lg px-3 py-1.5 text-xs"
                style={{ background: 'var(--bg-hover)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
              >
                {DATE_RANGES.map((dr) => (
                  <option key={dr} value={dr}>{dr}</option>
                ))}
              </select>
            </div>
          </div>
        </GlassCard>

        {isLoading && (
          <GlassCard>
            <LoadingSpinner size="md" text="Loading alerts..." />
          </GlassCard>
        )}

        {!isLoading && filteredAlerts.length === 0 && (
          <GlassCard>
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full" style={{ background: 'var(--bg-hover)' }}>
                <svg className="h-8 w-8" style={{ color: 'var(--text-tertiary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>No alerts found</p>
              <p className="mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                {alerts.length === 0
                  ? 'Generate a forecast to enable alert intelligence.'
                  : 'All alerts match your current filters.'}
              </p>
            </div>
          </GlassCard>
        )}

        {!isLoading && filteredAlerts.length > 0 && (
          <div className="space-y-3">
            {filteredAlerts.map((alert) => {
              const config = SEVERITY_CONFIG[alert.severity];
              const isExpanded = expandedAlert === alert.id;

              return (
                <div
                  key={alert.id}
                  className="rounded-xl border transition-all duration-200"
                  style={{
                    borderColor: alert.acknowledged ? 'var(--border)' : config.color + '40',
                    background: alert.acknowledged ? 'transparent' : config.bg,
                  }}
                >
                  <button
                    onClick={() => toggleExpand(alert.id)}
                    className="flex w-full items-start gap-4 p-4 text-left"
                    style={{ background: 'transparent', border: 'none' }}
                  >
                    <div
                      className="mt-1 h-3 w-3 flex-shrink-0 rounded-full"
                      style={{
                        background: config.color,
                        boxShadow: alert.severity === 'critical' ? `0 0 8px ${config.color}60` : 'none',
                        animation: alert.severity === 'critical' && !alert.acknowledged ? 'pulse 2s ease-in-out infinite' : 'none',
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p
                          className="text-sm font-semibold"
                          style={{ color: alert.acknowledged ? 'var(--text-tertiary)' : 'var(--text-primary)' }}
                        >
                          {alert.title}
                        </p>
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
                          style={{ background: config.color + '20', color: config.color }}
                        >
                          {alert.severity}
                        </span>
                        {alert.acknowledged && (
                          <span
                            className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                            style={{ background: 'var(--bg-hover)', color: 'var(--text-tertiary)' }}
                          >
                            Acknowledged
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        {alert.channel} · {alert.category}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {new Date(alert.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <svg
                        className="h-4 w-4 transition-transform duration-200"
                        style={{
                          color: 'var(--text-tertiary)',
                          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        }}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="animate-fade-in border-t px-4 pb-4 pt-3" style={{ borderColor: 'var(--border)' }}>
                      <p className="mb-4 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                        {alert.description}
                      </p>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="rounded-lg p-3" style={{ background: 'var(--bg-hover)' }}>
                          <p className="mb-1 text-xs font-semibold uppercase" style={{ color: 'var(--text-tertiary)' }}>Root Cause</p>
                          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{alert.rootCause}</p>
                        </div>
                        <div className="rounded-lg p-3" style={{ background: 'var(--bg-hover)' }}>
                          <p className="mb-1 text-xs font-semibold uppercase" style={{ color: 'var(--text-tertiary)' }}>Suggested Action</p>
                          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{alert.suggestedAction}</p>
                        </div>
                      </div>

                      {!alert.acknowledged && (
                        <div className="mt-4 flex justify-end">
                          <Button
                            onClick={() => acknowledge(alert.id)}
                            variant="secondary"
                            size="sm"
                          >
                            Acknowledge
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
