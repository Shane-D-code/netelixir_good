import { Request, Response, NextFunction } from 'express';
import { HolidayService } from '../services/holiday.service';
import { ValidationError } from '../../../shared/middleware/error-handler';

const holidayService = new HolidayService();

export async function getHolidays(req: Request, res: Response, next: NextFunction) {
  try {
    const year = req.query.year ? parseInt(req.query.year as string) : undefined;
    const holidays = holidayService.getHolidays(year);
    res.json({ success: true, holidays });
  } catch (err) {
    next(err);
  }
}

export async function getUpcomingHolidays(req: Request, res: Response, next: NextFunction) {
  try {
    const days = req.query.days ? parseInt(req.query.days as string) : 30;
    const holidays = holidayService.getUpcomingHolidays(days);
    res.json({ success: true, holidays });
  } catch (err) {
    next(err);
  }
}

export async function checkHoliday(req: Request, res: Response, next: NextFunction) {
  try {
    const { date } = req.params;
    if (!date) throw new ValidationError('Date parameter is required (YYYY-MM-DD)');

    const result = holidayService.isHoliday(date);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}
