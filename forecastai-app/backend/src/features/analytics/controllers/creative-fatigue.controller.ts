import { Request, Response, NextFunction } from 'express';
import { creativeFatigueDetectorService } from '../services/creative-fatigue-detector.service';
import { ValidationError } from '../../../shared/middleware/error-handler';

export async function detectCreativeFatigue(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { creatives } = req.body;

    if (!creatives || !Array.isArray(creatives)) {
      throw new ValidationError('creatives array is required');
    }

    const result = creativeFatigueDetectorService.detect(creatives);

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}
