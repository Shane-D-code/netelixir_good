import React, { useEffect, useState } from 'react';
import GlassCard from './GlassCard';

interface ModelWeightsDisplayProps {
  weights: Record<string, number>;
  modelNames?: Record<string, string>;
}

const defaultNames: Record<string, string> = {
  AutoARIMA: 'AutoARIMA',
  AutoETS: 'AutoETS',
  AutoTheta: 'AutoTheta',
  SeasonalNaive: 'Seasonal Naive',
  HistoricAverage: 'Historic Average',
  'Holt-Winters (fallback)': 'Holt-Winters',
  prophet: 'Holt-Winters',
  ets: 'ETS',
  random_forest: 'Theta',
  gradient_boost: 'ETS Mult. Seasonal',
  ensemble: 'Ensemble',
};

export default function ModelWeightsDisplay({ weights, modelNames }: ModelWeightsDisplayProps) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const entries = Object.entries(weights).sort(([, a], [, b]) => b - a);
  const names = modelNames ?? defaultNames;

  if (entries.length === 0) {
    return (
      <GlassCard title="Model Weights">
        <p className="text-sm" style={{ color: 'var(--text-tertiary, #7A7060)' }}>
          No model weights available
        </p>
      </GlassCard>
    );
  }

  return (
    <GlassCard title="Model Weights">
      <div className="space-y-3">
        {entries.map(([model, weight]) => {
          const pct = Math.round(weight * 100);
          return (
            <div key={model}>
              <div className="mb-1.5 flex items-center justify-between">
                <span
                  className="text-sm font-medium"
                  style={{ color: 'var(--text-primary, #F5F0E8)' }}
                >
                  {names[model] ?? model}
                </span>
                <span
                  className="text-xs font-semibold tabular-nums"
                  style={{ color: 'var(--accent, #C8A86B)' }}
                >
                  {pct}%
                </span>
              </div>
              <div
                className="h-2 w-full overflow-hidden rounded-full"
                style={{ backgroundColor: 'var(--bg-tertiary, rgba(255,255,255,0.06))' }}
              >
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: animated ? `${pct}%` : '0%',
                    background: `linear-gradient(90deg, var(--accent, #C8A86B), var(--accent-light, #D4B87A))`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}
