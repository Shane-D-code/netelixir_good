import { Request, Response, NextFunction } from 'express';
import { goalPlannerService } from '../services/goal-planner.service';
import { ValidationError } from '../../../shared/middleware/error-handler';

export async function planGoal(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { targetRevenue, days, currentBudgets, historicalData } = req.body;

    if (!targetRevenue || !days) {
      throw new ValidationError('targetRevenue and days are required');
    }

    const result = goalPlannerService.planGoal(targetRevenue, days, currentBudgets || {}, historicalData);

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}
