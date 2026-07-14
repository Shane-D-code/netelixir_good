import React, { useState } from 'react';
import BackButton from '../../../shared/components/ui/BackButton';
import GoalPlannerPage from './GoalPlannerPage';
import PromotionSimulatorPage from './PromotionSimulatorPage';
import StressTestPage from './StressTestPage';
import MarketShockPage from './MarketShockPage';

type PlannerTab = 'goals' | 'promo' | 'stress' | 'shock';

const TABS: { key: PlannerTab; label: string }[] = [
  { key: 'goals', label: 'Goals' },
  { key: 'promo', label: 'Promo Sim' },
  { key: 'stress', label: 'Stress Test' },
  { key: 'shock', label: 'Market Shock' },
];

export default function PlannerPage() {
  const [activeTab, setActiveTab] = useState<PlannerTab>('goals');

  const renderContent = () => {
    switch (activeTab) {
      case 'goals':
        return <GoalPlannerPage embedded />;
      case 'promo':
        return <PromotionSimulatorPage embedded />;
      case 'stress':
        return <StressTestPage embedded />;
      case 'shock':
        return <MarketShockPage embedded />;
    }
  };

  return (
    <div className="min-h-screen pt-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <div className="mb-2">
            <BackButton />
          </div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Planner</h1>
          <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>Goal planning, promotion simulation, stress testing, and market shock analysis</p>
        </div>

        <div className="mb-6 flex gap-1 rounded-xl p-1" style={{ background: 'var(--bg-hover)' }}>
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200"
              style={{
                background: activeTab === tab.key ? 'var(--bg-card)' : 'transparent',
                color: activeTab === tab.key ? 'var(--text-primary)' : 'var(--text-tertiary)',
                boxShadow: activeTab === tab.key ? 'var(--shadow-sm)' : 'none',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {renderContent()}
      </div>
    </div>
  );
}
