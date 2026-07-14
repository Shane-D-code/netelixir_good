import React from 'react';
import { classNames } from '../../utils/formatters';

interface Tab {
  label: string;
  value: string;
  icon?: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (value: string) => void;
  className?: string;
}

export default function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
  return (
    <div
      className={classNames(
        'flex gap-1 overflow-x-auto scrollbar-hide',
        className
      )}
      style={{ borderBottom: '1px solid var(--border, rgba(200,168,107,0.15))' }}
    >
      {tabs.map((tab) => {
        const isActive = tab.value === activeTab;
        return (
          <button
            key={tab.value}
            onClick={() => onChange(tab.value)}
            className={classNames(
              'relative flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors duration-200',
              isActive
                ? 'text-[var(--text-primary,#F5F0E8)]'
                : 'text-[var(--text-tertiary,#7A7060)] hover:text-[var(--text-secondary,#B8B0A0)]'
            )}
            style={{ background: 'transparent', border: 'none' }}
          >
            {tab.icon && (
              <span style={{ color: isActive ? 'var(--accent, #C8A86B)' : 'inherit' }}>
                {tab.icon}
              </span>
            )}
            {tab.label}
            {isActive && (
              <span
                className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                style={{ backgroundColor: 'var(--accent, #C8A86B)' }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
