import React, { useState, useRef, useEffect } from 'react';
import { Alert } from '../../types/features';
import { classNames } from '../../utils/formatters';

interface AlertBellProps {
  unreadCount: number;
  alerts: Alert[];
  onOpen: () => void;
  onAcknowledge: (id: string) => void;
  className?: string;
}

const severityColors: Record<string, string> = {
  critical: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
};

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function AlertBell({ unreadCount, alerts, onOpen, onAcknowledge, className }: AlertBellProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const recentAlerts = alerts.slice(0, 8);

  return (
    <div ref={ref} className={classNames('relative', className)}>
      <button
        onClick={() => {
          setOpen((prev) => !prev);
          if (!open) onOpen();
        }}
        className="relative rounded-xl p-2.5 transition-colors hover:bg-[var(--bg-hover, rgba(255,255,255,0.06))]"
        style={{ color: 'var(--text-secondary, #B8B0A0)' }}
        aria-label="Alerts"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
          />
        </svg>
        {unreadCount > 0 && (
          <span
            className="absolute -right-0.5 -top-0.5 flex h-4.5 min-h-[18px] w-4.5 min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
            style={{
              backgroundColor: '#EF4444',
              lineHeight: '18px',
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl shadow-2xl"
          style={{
            backgroundColor: 'var(--bg-card, rgba(22,20,16,0.95))',
            border: '1px solid var(--border, rgba(200,168,107,0.15))',
            backdropFilter: 'blur(20px)',
          }}
        >
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: '1px solid var(--border, rgba(200,168,107,0.15))' }}
          >
            <span
              className="text-sm font-semibold"
              style={{ color: 'var(--text-primary, #F5F0E8)' }}
            >
              Alerts
            </span>
            {unreadCount > 0 && (
              <span
                className="rounded-full px-2 py-0.5 text-xs font-medium"
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.12)',
                  color: '#EF4444',
                }}
              >
                {unreadCount} new
              </span>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {recentAlerts.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm" style={{ color: 'var(--text-tertiary, #7A7060)' }}>
                  No alerts
                </p>
              </div>
            ) : (
              recentAlerts.map((alert) => (
                <button
                  key={alert.id}
                  onClick={() => {
                    if (!alert.acknowledged) {
                      onAcknowledge(alert.id);
                    }
                  }}
                  className={classNames(
                    'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors',
                    !alert.acknowledged
                      ? 'hover:bg-[var(--bg-hover, rgba(255,255,255,0.04))]'
                      : 'opacity-50'
                  )}
                  style={{
                    borderBottom: '1px solid var(--border, rgba(200,168,107,0.08))',
                  }}
                >
                  <span
                    className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full"
                    style={{ backgroundColor: severityColors[alert.severity] ?? '#7A7060' }}
                  />
                  <div className="min-w-0 flex-1">
                    <p
                      className="truncate text-sm font-medium"
                      style={{ color: 'var(--text-primary, #F5F0E8)' }}
                    >
                      {alert.title}
                    </p>
                    <p
                      className="mt-0.5 truncate text-xs"
                      style={{ color: 'var(--text-tertiary, #7A7060)' }}
                    >
                      {alert.channel} · {timeAgo(alert.createdAt)}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
