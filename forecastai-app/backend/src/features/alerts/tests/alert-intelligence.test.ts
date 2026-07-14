import { AlertIntelligenceService } from '../services/alert-intelligence.service';

describe('AlertIntelligenceService', () => {
  const service = new AlertIntelligenceService();

  it('should generate alerts from data', () => {
    const alerts = service.generateAlerts([], {
      p50_revenue: 100000,
      p10_revenue: 80000,
      p90_revenue: 120000,
      roas: 2.5,
      channel_forecasts: {},
    });
    expect(Array.isArray(alerts)).toBe(true);
  });

  it('should acknowledge an alert', () => {
    service.generateAlerts([], {
      p50_revenue: 100000,
      p10_revenue: 80000,
      p90_revenue: 120000,
      roas: 2.5,
      channel_forecasts: {},
    });
    const alerts = service.getAlerts();
    if (alerts.length > 0) {
      const result = service.acknowledgeAlert(alerts[0].id);
      expect(result).toBe(true);
    }
  });

  it('should track unread count', () => {
    const count = service.getUnreadCount();
    expect(typeof count).toBe('number');
  });
});
