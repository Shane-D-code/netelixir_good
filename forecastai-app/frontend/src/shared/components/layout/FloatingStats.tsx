import React, { useState, useEffect } from 'react';
import { useForecastStore } from '../../../features/forecast/store/forecast.store';
import { formatCurrency } from '../../utils/formatters';

export default function FloatingStats() {
  const forecastResult = useForecastStore((s) => s.forecastResult);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (forecastResult) {
      const timer = setTimeout(() => setIsVisible(true), 100);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [forecastResult]);

  if (!forecastResult) return null;

  return (
    <div
      className={`floating-stats fixed bottom-6 left-6 z-40 hidden lg:block ${
        isVisible ? 'floating-stats-enter' : 'floating-stats-exit'
      }`}
    >
      <div className="card">
        <p className="label" style={{ marginBottom: 8 }}>Forecast Overview</p>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-6">
            <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>P50 Revenue</span>
            <span className="value">{formatCurrency(forecastResult.p50_revenue)}</span>
          </div>
          <div className="flex items-center justify-between gap-6">
            <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>ROAS</span>
            <span className="value">{forecastResult.roas.toFixed(2)}x</span>
          </div>
          <div className="flex items-center justify-between gap-6">
            <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Confidence</span>
            <span className="value">{forecastResult.confidence_score}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
