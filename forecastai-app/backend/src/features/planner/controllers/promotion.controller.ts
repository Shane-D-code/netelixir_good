import { Request, Response, NextFunction } from 'express';
import { promotionSimulatorService } from '../services/promotion-simulator.service';
import { ValidationError } from '../../../shared/middleware/error-handler';

export async function simulatePromotion(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { discountPercent, currentRevenue, currentAOV, profitMargin, elasticity } = req.body;

    if (discountPercent === undefined || currentRevenue === undefined) {
      throw new ValidationError('discountPercent and currentRevenue are required');
    }

    const result = promotionSimulatorService.simulate({
      discountPercent,
      currentRevenue,
      currentAOV: currentAOV || 50,
      profitMargin: profitMargin || 0.3,
      elasticity: elasticity || 1.5,
    });

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}
