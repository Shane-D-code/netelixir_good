import React from 'react';

export default function Footer() {
  return (
    <footer className="border-t" style={{ borderColor: 'var(--border)', background: 'var(--bg-main)' }}>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded" style={{ background: 'var(--accent)' }}>
              <svg className="h-3.5 w-3.5" style={{ color: 'var(--bg-main)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Forecast<span style={{ color: 'var(--accent)' }}>AI</span>
            </span>
          </div>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>
            &copy; {new Date().getFullYear()} ForecastAI. All rights reserved.
          </p>
          <div className="flex gap-4">
            <span style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>Privacy</span>
            <span style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>Terms</span>
            <span style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>Docs</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
