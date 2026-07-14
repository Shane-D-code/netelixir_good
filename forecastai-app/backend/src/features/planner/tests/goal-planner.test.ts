import { GoalPlannerService } from '../services/goal-planner.service';

describe('GoalPlannerService', () => {
  const service = new GoalPlannerService();

  it('should return required budgets for a revenue goal', () => {
    const result = service.planGoal(100000, 30, {
      'Google Ads': 10000,
      'Meta Ads': 8000,
      'Microsoft Ads': 5000,
    });
    expect(result).toHaveProperty('requiredBudgets');
    expect(result).toHaveProperty('totalRequiredBudget');
    expect(result).toHaveProperty('expectedROAS');
    expect(result).toHaveProperty('confidenceScore');
    expect(result).toHaveProperty('recommendations');
    expect(result.targetRevenue).toBe(100000);
    expect(result.days).toBe(30);
  });

  it('should return recommendations array', () => {
    const result = service.planGoal(50000, 30, {
      'Google Ads': 5000,
      'Meta Ads': 4000,
      'Microsoft Ads': 3000,
    });
    expect(Array.isArray(result.recommendations)).toBe(true);
  });
});
