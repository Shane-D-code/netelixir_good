import { Request, Response, NextFunction } from 'express';
import { executiveSummary } from '../services/executive-summary.service';
import { ValidationError } from '../../../shared/middleware/error-handler';

export async function generateReport(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { clientName, startDate, endDate, template, forecastData, channelBudgets, includeSections } = req.body;

    if (!clientName || !startDate || !endDate) {
      throw new ValidationError('clientName, startDate, and endDate are required');
    }

    const result = executiveSummary.generate({
      clientName,
      startDate,
      endDate,
      template: template || 'minimal',
      forecastData: forecastData || {},
      channelBudgets: channelBudgets || {},
      includeSections: includeSections || {},
    });

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function getTemplates(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = executiveSummary.getTemplates();

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}
