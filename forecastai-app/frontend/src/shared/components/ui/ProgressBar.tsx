import React, { useEffect, useState } from 'react';
import { classNames } from '../../utils/formatters';

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showPercentage?: boolean;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
} as const;

export default function ProgressBar({
  value,
  max = 100,
  label,
  showPercentage = true,
  color,
  size = 'md',
  className,
}: ProgressBarProps) {
  const [animated, setAnimated] = useState(false);
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={classNames('w-full', className)}>
      {(label || showPercentage) && (
        <div className="mb-2 flex items-center justify-between">
          {label && (
            <span
              className="text-sm font-medium"
              style={{ color: 'var(--text-primary, #F5F0E8)' }}
            >
              {label}
            </span>
          )}
          {showPercentage && (
            <span
              className="text-xs font-semibold tabular-nums"
              style={{ color: color ?? 'var(--accent, #C8A86B)' }}
            >
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      <div
        className={classNames('w-full overflow-hidden rounded-full', sizeClasses[size])}
        style={{
          backgroundColor: 'var(--bg-tertiary, rgba(255,255,255,0.06))',
        }}
      >
        <div
          className={classNames('h-full rounded-full transition-all duration-1000 ease-out')}
          style={{
            width: animated ? `${percentage}%` : '0%',
            backgroundColor: color ?? 'var(--accent, #C8A86B)',
          }}
        />
      </div>
    </div>
  );
}
