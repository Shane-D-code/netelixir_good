import { Request, Response, NextFunction } from 'express';
import { stressTesterService } from '../services/stress-tester.service';
import { ValidationError } from '../../../shared/middleware/error-handler';

export async function runStressTest(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { data, budgets } = req.body;

    if (!budgets) {
      throw new ValidationError('budgets are required');
    }

    const result = stressTesterService.runStressTest(data || [], budgets);

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}
