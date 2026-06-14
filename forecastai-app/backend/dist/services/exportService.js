"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportService = void 0;
class ExportService {
    toJSON(forecastResult) {
        return JSON.stringify(forecastResult, null, 2);
    }
    toCSV(forecastResult, id) {
        const { total_forecast, channel_forecasts } = forecastResult;
        const rows = [];
        rows.push('Date,Channel,P10,P25,P50,P75,P90');
        for (const [channel, fc] of Object.entries(channel_forecasts || {})) {
            const ch = fc;
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
exports.ExportService = ExportService;
//# sourceMappingURL=exportService.js.map