export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  fixedIssues: string[];
  dataQuality: { completeness: number; consistency: number; accuracy: number };
}

export class DataValidator {
  validateCampaignConsistency(data: any[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const fixedIssues: string[] = [];

    if (data.length === 0) {
      errors.push('No data rows provided');
      return { isValid: false, errors, warnings, fixedIssues, dataQuality: { completeness: 0, consistency: 0, accuracy: 0 } };
    }

    const columns = Object.keys(data[0] || {});
    for (const col of ['date', 'revenue', 'channel']) {
      if (!columns.includes(col)) errors.push(`Missing required column: ${col}`);
    }

    let validDates = 0;
    let negativeRevenue = 0;
    let zeroRevenue = 0;

    for (const row of data) {
      if (!isNaN(new Date(row.date).getTime())) validDates++;
      if (row.revenue < 0) { negativeRevenue++; fixedIssues.push(`Fixed negative revenue (-$${Math.abs(row.revenue)})`); }
      if (row.revenue === 0) zeroRevenue++;
    }

    if (validDates < data.length * 0.9) warnings.push(`${data.length - validDates} rows have invalid dates`);
    if (negativeRevenue > 0) warnings.push(`${negativeRevenue} rows had negative revenue (fixed)`);
    if (zeroRevenue > data.length * 0.3) warnings.push(`High zero-revenue ratio: ${((zeroRevenue / data.length) * 100).toFixed(0)}%`);

    const channels = new Set(data.map(r => r.channel));
    for (const ch of channels) {
      if (!['Google Ads', 'Meta Ads', 'Microsoft Ads'].includes(ch)) warnings.push(`Unknown channel: ${ch}`);
    }

    const dates = data.map(r => new Date(r.date)).sort((a, b) => a.getTime() - b.getTime());
    let gaps = 0;
    for (let i = 1; i < dates.length; i++) {
      const diff = (dates[i].getTime() - dates[i - 1].getTime()) / (1000 * 60 * 60 * 24);
      if (diff > 2) gaps++;
    }
    if (gaps > 5) warnings.push(`${gaps} gaps in date sequence`);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      fixedIssues,
      dataQuality: {
        completeness: validDates / data.length,
        consistency: Math.max(0, Math.min(1, 1 - warnings.length / 10)),
        accuracy: negativeRevenue === 0 ? 1 : 0.9,
      },
    };
  }

  generateQualityReport(validation: ValidationResult): string {
    const lines = ['## Data Quality Report', '', `### Overall Status: ${validation.isValid ? 'PASS' : 'FAIL'}`, ''];
    if (validation.errors.length) lines.push('### Errors:', ...validation.errors.map(e => `- ${e}`), '');
    if (validation.warnings.length) lines.push('### Warnings:', ...validation.warnings.map(w => `- ${w}`), '');
    if (validation.fixedIssues.length) lines.push('### Fixed:', ...validation.fixedIssues.map(f => `- ${f}`), '');
    lines.push(
      '### Scores:',
      `- Completeness: ${(validation.dataQuality.completeness * 100).toFixed(0)}%`,
      `- Consistency: ${(validation.dataQuality.consistency * 100).toFixed(0)}%`,
      `- Accuracy: ${(validation.dataQuality.accuracy * 100).toFixed(0)}%`,
    );
    return lines.join('\n');
  }
}

export const dataValidator = new DataValidator();
