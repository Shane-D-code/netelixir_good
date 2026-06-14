export class ExportService {
  toJSON(forecastResult: any): string {
    return JSON.stringify(forecastResult, null, 2);
  }

  toCSV(forecastResult: any, id: string): string {
    const { total_forecast, channel_forecasts } = forecastResult;
    const rows: string[] = [];
    rows.push('Date,Channel,P10,P25,P50,P75,P90');

    for (const [channel, fc] of Object.entries(channel_forecasts || {})) {
      const ch = fc as any;
      for (let i = 0; i < (ch.dates?.length || 0); i++) {
        rows.push([
          ch.dates[i],
          channel,
          ch.p10?.[i] ?? '',
          ch.p25?.[i] ?? '',
          ch.median?.[i] ?? '',
          ch.p75?.[i] ?? '',
          ch.p90?.[i] ?? '',
        ].join(','));
      }
    }

    if (total_forecast?.dates) {
      rows.push('');
      rows.push('Date,Channel,P10,P25,P50,P75,P90');
      for (let i = 0; i < total_forecast.dates.length; i++) {
        rows.push([
          total_forecast.dates[i],
          'Total',
          total_forecast.p10?.[i] ?? '',
          total_forecast.p25?.[i] ?? '',
          total_forecast.median?.[i] ?? '',
          total_forecast.p75?.[i] ?? '',
          total_forecast.p90?.[i] ?? '',
        ].join(','));
      }
    }

    return rows.join('\n');
  }
}
