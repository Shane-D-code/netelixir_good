"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ForecastComparison = void 0;
class ForecastComparison {
    compare(actual, forecast) {
        const n = Math.min(actual.length, forecast.length);
        if (n === 0) {
            return { mape: 0, mae: 0, rmse: 0, r2: 0, bias: 0, coverage_90: 0 };
        }
        const errors = [];
        const absErrors = [];
        const squaredErrors = [];
        const actualMean = actual.reduce((a, b) => a + b, 0) / n;
        for (let i = 0; i < n; i++) {
            const error = actual[i] - forecast[i];
            errors.push(error);
            absErrors.push(Math.abs(error));
            squaredErrors.push(error * error);
        }
        const mape = (errors.reduce((sum, _e, i) => sum + (actual[i] !== 0 ? Math.abs(errors[i]) / actual[i] : 0), 0) / n) * 100;
        const mae = absErrors.reduce((a, b) => a + b, 0) / n;
        const rmse = Math.sqrt(squaredErrors.reduce((a, b) => a + b, 0) / n);
        const ssRes = squaredErrors.reduce((a, b) => a + b, 0);
        const ssTot = actual.reduce((sum, val) => sum + Math.pow(val - actualMean, 2), 0);
        const r2 = ssTot > 0 ? 1 - (ssRes / ssTot) : 0;
        const bias = actualMean > 0 ? (errors.reduce((a, b) => a + b, 0) / n) / actualMean : 0;
        return { mape, mae, rmse, r2, bias, coverage_90: 0 };
    }
    compareScenarios(actual, forecasts) {
        const results = {};
        for (const [name, forecast] of Object.entries(forecasts)) {
            results[name] = this.compare(actual, forecast);
        }
        return results;
    }
}
exports.ForecastComparison = ForecastComparison;
//# sourceMappingURL=forecastComparison.js.map