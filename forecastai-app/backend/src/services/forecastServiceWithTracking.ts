import { jobQueue } from './jobQueue';
import { forecastService, parseCSVData, validateData, normalizeChannel } from './forecastService';
import { ForecastRequest } from '../models/ForecastRequest';
import logger from '../utils/logger';

export async function generateForecastWithTracking(
  csvContent: string,
  params: ForecastRequest,
  jobId: string
): Promise<any> {
  try {
    jobQueue.updateProgress(jobId, 5, 'processing');

    const rawData = parseCSVData(csvContent);
    jobQueue.updateProgress(jobId, 15);

    const warnings = validateData(rawData);
    if (warnings.length > 0) logger.warn(`Data validation warnings: ${warnings.join(', ')}`);
    jobQueue.updateProgress(jobId, 20);

    for (const row of rawData) {
      row.channel = normalizeChannel(row.channel);
    }

    jobQueue.updateProgress(jobId, 25);

    const result = await forecastService.generateForecast(csvContent, params);
    jobQueue.updateProgress(jobId, 85);

    const finalResult = {
      ...result,
      id: jobId,
      generatedAt: new Date().toISOString(),
      params,
    };

    jobQueue.updateProgress(jobId, 100, 'completed');
    jobQueue.completeJob(jobId, finalResult);

    return finalResult;
  } catch (error: any) {
    jobQueue.failJob(jobId, error.message);
    throw error;
  }
}
