import { Request, Response, NextFunction } from 'express';
import { marketShockSimulatorService } from '../services/market-shock.service';
import { ValidationError } from '../../../shared/middleware/error-handler';

export async function simulateMarketShock(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { shockType, severity, data, budgets } = req.body;

    if (!shockType || !severity) {
      throw new ValidationError('shockType and severity are required');
    }

    const result = marketShockSimulatorService.simulate(
      shockType,
      severity,
      data || [],
      budgets || {}
    );

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}
