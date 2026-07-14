import { Request, Response, NextFunction } from 'express';
import { roasTimeMachine } from '../services/roas-time-machine.service';
import { ValidationError } from '../../../shared/middleware/error-handler';

export async function recalculate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { budgets, data } = req.body;

    if (!budgets) {
      throw new ValidationError('budgets are required');
    }

    const result = roasTimeMachine.recalculate(budgets, data || []);

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function getPresets(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = roasTimeMachine.getPresetScenarios();

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function findOptimalAllocation(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { data, totalBudget } = req.body;

    if (!totalBudget) {
      throw new ValidationError('totalBudget is required');
    }

    const result = roasTimeMachine.findOptimal(data || [], totalBudget);

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}
