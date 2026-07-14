import { PromotionSimulatorService } from '../services/promotion-simulator.service';

describe('PromotionSimulatorService', () => {
  const service = new PromotionSimulatorService();

  it('should simulate promotion impact', () => {
    const result = service.simulate({
      discountPercent: 20,
      currentRevenue: 50000,
      currentAOV: 75,
      profitMargin: 0.3,
      elasticity: 1.5,
    });
    expect(result).toHaveProperty('estimatedRevenue');
    expect(result).toHaveProperty('estimatedAOV');
    expect(result).toHaveProperty('estimatedProfit');
    expect(result).toHaveProperty('estimatedROAS');
    expect(result).toHaveProperty('volumeIncrease');
    expect(result).toHaveProperty('recommendation');
  });

  it('should show higher volume with higher discount', () => {
    const low = service.simulate({ discountPercent: 10, currentRevenue: 50000, currentAOV: 75, profitMargin: 0.3, elasticity: 1.5 });
    const high = service.simulate({ discountPercent: 30, currentRevenue: 50000, currentAOV: 75, profitMargin: 0.3, elasticity: 1.5 });
    expect(high.volumeIncrease).toBeGreaterThanOrEqual(low.volumeIncrease);
  });
});
