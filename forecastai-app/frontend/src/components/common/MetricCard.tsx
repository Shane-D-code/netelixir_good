import React from 'react';
import { classNames } from '../../utils/formatters';

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  delta?: { text: string; isPositive: boolean };
  icon?: React.ReactNode;
  className?: string;
  tooltip?: string;
  gradient?: boolean;
}

export default function MetricCard({
  title,
  value,
  subtitle,
  delta,
  icon,
  className,
  tooltip,
  gradient = true,
}: MetricCardProps) {
  return (
    <div className={classNames('metric-card', className)}>
      {gradient && (
        <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full" style={{ background: 'var(--accent-glow)' }} />
      )}
      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <p className="label">{title}</p>
          {icon && <div style={{ color: 'var(--accent-light)' }}>{icon}</div>}
        </div>
        <p className="value">
          {value}
        </p>
        {delta && (
          <span
            className={classNames(
              'inline-flex items-center gap-1',
              delta.isPositive ? 'trend-up' : 'trend-down'
            )}
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d={delta.isPositive
                  ? 'M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.17a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04l-3.96-4.058V16.25A.75.75 0 0110 17z'
                  : 'M10 3a.75.75 0 01.75.75v10.638l3.96-4.158a.75.75 0 111.08 1.04l-5.25 5.5a.75.75 0 01-1.08 0l-5.25-5.5a.75.75 0 111.08-1.04l3.96 4.158V3.75A.75.75 0 0110 3z'
                }
                clipRule="evenodd"
              />
            </svg>
            {delta.text}
          </span>
        )}
        {subtitle && (
          <p className="mt-1" style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>{subtitle}</p>
        )}
      </div>
      {tooltip && (
        <div className="group absolute right-3 top-3">
          <div className="flex h-5 w-5 cursor-help items-center justify-center rounded-full" style={{ background: 'var(--bg-hover)' }}>
            <span style={{ color: 'var(--text-tertiary)', fontSize: '10px' }}>?</span>
          </div>
          <div className="invisible absolute right-0 top-6 w-48 rounded-lg p-2 text-xs opacity-0 transition-all group-hover:visible group-hover:opacity-100 glass-card" style={{ zIndex: 10 }}>
            {tooltip}
          </div>
        </div>
      )}
    </div>
  );
}
