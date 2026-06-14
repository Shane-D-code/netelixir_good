import { Request, Response, NextFunction } from 'express';
import { parse } from 'csv-parse/sync';
import { CsvError } from '../middleware/errorHandler';
import logger from '../utils/logger';

export async function uploadCSV(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.file) {
      throw new CsvError('CSV file is required');
    }

    const csvContent = req.file.buffer.toString('utf-8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
    });

    if (records.length === 0) {
      throw new CsvError('CSV file contains no data rows');
    }

    const columns = Object.keys(records[0]);
    const requiredColumns = ['date', 'revenue', 'channel'];
    const foundColumns = requiredColumns.filter(col =>
      columns.some(c => c.toLowerCase().trim() === col)
    );

    if (foundColumns.length === 0) {
      throw new CsvError(`CSV missing required columns. Expected at least one of: date, revenue, channel. Found: ${columns.join(', ')}`);
    }

    const channels = new Set<string>();
    const dateRange = { min: '', max: '' };
    let totalRevenue = 0;

    for (const record of records) {
      for (const [key, val] of Object.entries(record)) {
        const lowerKey = key.toLowerCase().trim();
        if (lowerKey === 'channel') channels.add(String(val));
        if (lowerKey === 'revenue') totalRevenue += parseFloat(String(val)) || 0;
        if (lowerKey === 'date') {
          const d = String(val);
          if (!dateRange.min || d < dateRange.min) dateRange.min = d;
          if (!dateRange.max || d > dateRange.max) dateRange.max = d;
        }
      }
    }

    logger.info('CSV upload processed', {
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
  } catch (err) {
    next(err);
  }
}
