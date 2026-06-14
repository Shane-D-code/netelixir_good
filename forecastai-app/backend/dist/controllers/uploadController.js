"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadCSV = uploadCSV;
const sync_1 = require("csv-parse/sync");
const errorHandler_1 = require("../middleware/errorHandler");
const logger_1 = __importDefault(require("../utils/logger"));
async function uploadCSV(req, res, next) {
    try {
        if (!req.file) {
            throw new errorHandler_1.CsvError('CSV file is required');
        }
        const csvContent = req.file.buffer.toString('utf-8');
        const records = (0, sync_1.parse)(csvContent, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
            relax_column_count: true,
        });
        if (records.length === 0) {
            throw new errorHandler_1.CsvError('CSV file contains no data rows');
        }
        const columns = Object.keys(records[0]);
        const requiredColumns = ['date', 'revenue', 'channel'];
        const foundColumns = requiredColumns.filter(col => columns.some(c => c.toLowerCase().trim() === col));
        if (foundColumns.length === 0) {
            throw new errorHandler_1.CsvError(`CSV missing required columns. Expected at least one of: date, revenue, channel. Found: ${columns.join(', ')}`);
        }
        const channels = new Set();
        const dateRange = { min: '', max: '' };
        let totalRevenue = 0;
        for (const record of records) {
            for (const [key, val] of Object.entries(record)) {
                const lowerKey = key.toLowerCase().trim();
                if (lowerKey === 'channel')
                    channels.add(String(val));
                if (lowerKey === 'revenue')
                    totalRevenue += parseFloat(String(val)) || 0;
                if (lowerKey === 'date') {
                    const d = String(val);
                    if (!dateRange.min || d < dateRange.min)
                        dateRange.min = d;
                    if (!dateRange.max || d > dateRange.max)
                        dateRange.max = d;
                }
            }
        }
        logger_1.default.info('CSV upload processed', {
            rowCount: records.length,
            channels: Array.from(channels),
            missingColumns: requiredColumns.filter(c => !foundColumns.includes(c)),
        });
        res.json({
            success: true,
            data: {
                row_count: records.length,
                columns,
                channels_found: Array.from(channels),
                date_range: dateRange,
                total_revenue: Math.round(totalRevenue * 100) / 100,
                missing_columns: requiredColumns.filter(c => !foundColumns.includes(c)),
                preview: records.slice(0, 5),
            },
        });
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=uploadController.js.map