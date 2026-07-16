import { StressTesterService } from '../services/stress-tester.service';

describe('StressTesterService', () => {
  const service = new StressTesterService();
  const mockBudgets = { 'Google Ads': 10000, 'Meta Ads': 8000, 'Microsoft Ads': 5000 };

  it('should run stress tests and return scenarios', () => {
    const result = service.runStressTest([], mockBudgets);
    expect(result).toHaveProperty('scenarios');
    expect(result).toHaveProperty('overall_resilience_score');
    expect(result.scenarios.length).toBeGreaterThan(0);
  });

  it('should expose planner-friendly metric fields for each scenario', () => {
    const result = service.runStressTest([{ channel: 'Google Ads', revenue: 10000, spend: 2500 }], mockBudgets);
    const firstScenario = result.scenarios[0];

    expect(firstScenario).toHaveProperty('revenue_impact_dollar');
    expect(firstScenario).toHaveProperty('revenue_impact_percent');
    expect(firstScenario).toHaveProperty('roas_impact');
    expect(firstScenario).toHaveProperty('confidence_score');
  });

  it('should include all 4 scenario types', () => {
    const result = service.runStressTest([], mockBudgets);
    const types = result.scenarios.map(s => s.type);
    expect(types).toContain('cpc_increase');
    expect(types).toContain('cvr_drop');
    expect(types).toContain('budget_cut');
    expect(types).toContain('market_downturn');
  });

  it('each scenario should have required fields', () => {
    const result = service.runStressTest([], mockBudgets);
    result.scenarios.forEach(scenario => {
      expect(scenario).toHaveProperty('name');
      expect(scenario).toHaveProperty('revenue_impact_dollar');
      expect(scenario).toHaveProperty('revenue_impact_percent');
      expect(scenario).toHaveProperty('roas_impact');
      expect(scenario).toHaveProperty('confidence_score');
      expect(scenario).toHaveProperty('recommendation');
      expect(scenario).toHaveProperty('severity');
    });
  });
});
