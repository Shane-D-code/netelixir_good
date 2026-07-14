import { Request, Response, NextFunction } from 'express';
import { budgetOptimizerService } from '../services/budget-optimizer.service';
import { ValidationError } from '../../../shared/middleware/error-handler';

export async function simulateBudget(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { channel, percentage_change, current_budgets, base_revenue } = req.body;

    if (!channel || percentage_change === undefined || !current_budgets || !base_revenue) {
      throw new ValidationError('channel, percentage_change, current_budgets, and base_revenue are required');
    }

    const result = budgetOptimizerService.simulateBudgetChange(
      current_budgets,
      channel,
      percentage_change,
      base_revenue
    );

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function optimizeBudget(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { current_budgets, total_budget, historical_roas } = req.body;

    if (!current_budgets || !total_budget || !historical_roas) {
      throw new ValidationError('current_budgets, total_budget, and historical_roas are required');
    }

    const result = budgetOptimizerService.optimizeAllocation(
      current_budgets,
      total_budget,
      historical_roas
    );

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function getElasticityCurve(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { channel } = req.params;
    const { current_budgets, base_revenue } = req.query;

    if (!channel || !current_budgets || !base_revenue) {
      throw new ValidationError('channel, current_budgets, and base_revenue are required');
    }

    const result = budgetOptimizerService.getRevenueCurve(
      JSON.parse(current_budgets as string),
      parseFloat(base_revenue as string),
      channel
    );

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}
