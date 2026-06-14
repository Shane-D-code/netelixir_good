import { Request, Response, NextFunction } from 'express';
import { ValidationError } from './errorHandler';

const VALID_CHANNELS = ['Google Ads', 'Meta Ads', 'Microsoft Ads'];

function normalizeChannelName(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('google') || lower === 'google') return 'Google Ads';
  if (lower.includes('meta') || lower.includes('facebook') || lower === 'meta') return 'Meta Ads';
  if (lower.includes('microsoft') || lower.includes('bing') || lower === 'microsoft') return 'Microsoft Ads';
  return name;
}

function parseBodyField(req: Request, field: string): void {
  const val = req.body[field];
  if (typeof val === 'string') {
    try { req.body[field] = JSON.parse(val); }
    catch { throw new ValidationError(`${field} must be a valid JSON object`); }
  }
}

export function validateForecastRequest(req: Request, _res: Response, next: NextFunction): void {
  if (!req.body || Object.keys(req.body).length === 0) {
    throw new ValidationError('Request body is missing. Ensure the request is sent as multipart/form-data with a file and parameters');
  }
  parseBodyField(req, 'channel_budgets');
  if (req.body.forecast_days !== undefined && typeof req.body.forecast_days === 'string') {
    req.body.forecast_days = parseInt(req.body.forecast_days, 10);
  }
  if (req.body.confidence_level !== undefined && typeof req.body.confidence_level === 'string') {
    req.body.confidence_level = parseFloat(req.body.confidence_level);
  }
  if (req.body.n_simulations !== undefined && typeof req.body.n_simulations === 'string') {
    req.body.n_simulations = parseInt(req.body.n_simulations, 10);
  }

  const { channel_budgets, forecast_days, confidence_level, n_simulations } = req.body;

  if (!channel_budgets || typeof channel_budgets !== 'object') {
    throw new ValidationError('channel_budgets is required and must be an object');
  }

  const normalized: Record<string, number> = {};
  for (const [channel, budget] of Object.entries(channel_budgets)) {
    const normalizedName = normalizeChannelName(channel);
    if (!VALID_CHANNELS.includes(normalizedName)) {
      throw new ValidationError(`Invalid channel: "${channel}". Valid channels: ${VALID_CHANNELS.join(', ')}`);
    }
    if (typeof budget !== 'number' || budget < 0) {
      throw new ValidationError(`Budget for "${channel}" must be a non-negative number, got ${typeof budget} ${budget}`);
    }
    normalized[normalizedName] = budget;
  }
  req.body.channel_budgets = normalized;

  if (forecast_days && (forecast_days < 7 || forecast_days > 365)) {
    throw new ValidationError(`forecast_days must be between 7 and 365, got ${forecast_days}`);
  }

  if (confidence_level && (confidence_level < 0.5 || confidence_level > 0.99)) {
    throw new ValidationError(`confidence_level must be between 0.5 and 0.99, got ${confidence_level}`);
  }

  if (n_simulations && (n_simulations < 100 || n_simulations > 10000)) {
    throw new ValidationError(`n_simulations must be between 100 and 10000, got ${n_simulations}`);
  }

  next();
}

export function validateBudgetSimulation(req: Request, _res: Response, next: NextFunction): void {
  const { channel, percentage_change, current_budgets, base_revenue } = req.body;

  const normalizedChannel = normalizeChannelName(channel);
  if (!normalizedChannel || !VALID_CHANNELS.includes(normalizedChannel)) {
    throw new ValidationError(`Invalid channel "${channel}". Valid channels: ${VALID_CHANNELS.join(', ')}`);
  }
  req.body.channel = normalizedChannel;

  if (percentage_change === undefined || percentage_change < -100 || percentage_change > 200) {
    throw new ValidationError(`percentage_change must be between -100 and 200, got ${percentage_change}`);
  }

  if (!current_budgets || typeof current_budgets !== 'object') {
    throw new ValidationError('current_budgets is required and must be an object');
  }

  if (base_revenue === undefined || base_revenue === null || typeof base_revenue !== 'number') {
    throw new ValidationError(`base_revenue is required and must be a number, got ${typeof base_revenue}`);
  }

  next();
}

export function validateCSVUpload(req: Request, _res: Response, next: NextFunction): void {
  if (!req.file) {
    throw new ValidationError('CSV file is required');
  }

  if (!req.file.originalname.endsWith('.csv')) {
    throw new ValidationError(`Only CSV files are accepted, got "${req.file.originalname}"`);
  }

  if (req.file.size > 10 * 1024 * 1024) {
    const sizeMB = (req.file.size / (1024 * 1024)).toFixed(2);
    throw new ValidationError(`File size must be less than 10MB, got ${sizeMB}MB`);
  }

  next();
}
