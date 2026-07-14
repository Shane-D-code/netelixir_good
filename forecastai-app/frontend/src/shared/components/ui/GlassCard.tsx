import React from 'react';
import { classNames } from '../../utils/formatters';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  badge?: string;
  onClick?: () => void;
}

export default function GlassCard({
  children,
  className,
  title,
  badge,
  onClick,
}: GlassCardProps) {
  return (
    <div
      onClick={onClick}
      className={classNames(
        'glass-card',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {(title || badge) && (
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          {title && (
            <h3 style={{ color: 'var(--text-primary)' }} className="text-lg font-semibold">{title}</h3>
          )}
          {badge && (
            <span className="Badge">{badge}</span>
          )}
        </div>
      )}
      <div className={title || badge ? 'px-6 pb-6' : 'p-6'}>
        {children}
      </div>
    </div>
  );
}
