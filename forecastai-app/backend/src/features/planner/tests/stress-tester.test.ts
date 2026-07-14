import { StressTesterService } from '../services/stress-tester.service';

describe('StressTesterService', () => {
  const service = new StressTesterService();
  const mockBudgets = { 'Google Ads': 10000, 'Meta Ads': 8000, 'Microsoft Ads': 5000 };

  it('should run stress tests and return scenarios', () => {
    const result = service.runStressTest([], mockBudgets);
    expect(result).toHaveProperty('scenarios');
    expect(result).toHaveProperty('overallResilience');
    expect(result.scenarios.length).toBeGreaterThan(0);
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
      expect(scenario).toHaveProperty('revenueImpact');
      expect(scenario).toHaveProperty('roasImpact');
      expect(scenario).toHaveProperty('confidence');
      expect(scenario).toHaveProperty('recommendation');
      expect(scenario).toHaveProperty('severity');
    });
  });
});
