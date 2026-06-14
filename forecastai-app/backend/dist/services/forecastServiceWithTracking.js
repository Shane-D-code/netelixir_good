"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateForecastWithTracking = generateForecastWithTracking;
const jobQueue_1 = require("./jobQueue");
const forecastService_1 = require("./forecastService");
const logger_1 = __importDefault(require("../utils/logger"));
async function generateForecastWithTracking(csvContent, params, jobId) {
    try {
        jobQueue_1.jobQueue.updateProgress(jobId, 5, 'processing');
        const rawData = (0, forecastService_1.parseCSVData)(csvContent);
        jobQueue_1.jobQueue.updateProgress(jobId, 15);
        const warnings = (0, forecastService_1.validateData)(rawData);
        if (warnings.length > 0)
            logger_1.default.warn(`Data validation warnings: ${warnings.join(', ')}`);
        jobQueue_1.jobQueue.updateProgress(jobId, 20);
        for (const row of rawData) {
            row.channel = (0, forecastService_1.normalizeChannel)(row.channel);
        }
        jobQueue_1.jobQueue.updateProgress(jobId, 25);
        const result = await forecastService_1.forecastService.generateForecast(csvContent, params);
        jobQueue_1.jobQueue.updateProgress(jobId, 85);
        const finalResult = {
            ...result,
            id: jobId,
            generatedAt: new Date().toISOString(),
            params,
        };
        jobQueue_1.jobQueue.updateProgress(jobId, 100, 'completed');
        jobQueue_1.jobQueue.completeJob(jobId, finalResult);
        return finalResult;
    }
    catch (error) {
        jobQueue_1.jobQueue.failJob(jobId, error.message);
        throw error;
    }
}
//# sourceMappingURL=forecastServiceWithTracking.js.map