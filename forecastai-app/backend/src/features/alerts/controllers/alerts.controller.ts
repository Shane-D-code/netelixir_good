import { Request, Response, NextFunction } from 'express';
import { alertIntelligence } from '../services/alert-intelligence.service';
import { ValidationError } from '../../../shared/middleware/error-handler';

export async function generateAlerts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { data, forecastResult } = req.body;

    if (!data) {
      throw new ValidationError('data is required');
    }

    const result = alertIntelligence.generateAlerts(data, forecastResult || {});

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function getAlerts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { severity, channel, startDate, endDate } = req.query;

    const filters: Record<string, string> = {};
    if (severity) filters.severity = severity as string;
    if (channel) filters.channel = channel as string;
    if (startDate) filters.startDate = startDate as string;
    if (endDate) filters.endDate = endDate as string;

    const result = alertIntelligence.getAlerts(Object.keys(filters).length > 0 ? filters : undefined);

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function acknowledgeAlert(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;

    if (!id) {
      throw new ValidationError('alert id is required');
    }

    const result = alertIntelligence.acknowledgeAlert(id);

    res.json({ success: true, data: { acknowledged: result } });
  } catch (err) {
    next(err);
  }
}

export async function acknowledgeAllAlerts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const count = alertIntelligence.acknowledgeAll();

    res.json({ success: true, data: { acknowledged: count } });
  } catch (err) {
    next(err);
  }
}

export async function getUnreadCount(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const count = alertIntelligence.getUnreadCount();

    res.json({ success: true, data: { count } });
  } catch (err) {
    next(err);
  }
}
