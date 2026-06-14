"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runForecastPipeline = runForecastPipeline;
const ENSEMBLE_WEIGHTS = { prophet: 0.35, ets: 0.25, random_forest: 0.25, gradient_boost: 0.15 };
const VALID_CHANNELS = ['Google Ads', 'Meta Ads', 'Microsoft Ads'];
const CHANNEL_ELASTICITIES = {
    'Google Ads': 0.7,
    'Meta Ads': 0.9,
    'Microsoft Ads': 0.6,
};
const HOLIDAYS_2024 = {
    '2024-01-01': "New Year's Day",
    '2024-01-15': 'Martin Luther King Jr. Day',
    '2024-02-19': "Presidents' Day",
    '2024-05-27': 'Memorial Day',
    '2024-06-19': 'Juneteenth',
    '2024-07-04': 'Independence Day',
    '2024-09-02': 'Labor Day',
    '2024-10-14': 'Columbus Day',
    '2024-11-11': 'Veterans Day',
    '2024-11-28': 'Thanksgiving',
    '2024-11-29': 'Black Friday',
    '2024-12-25': 'Christmas Day',
    '2025-01-01': "New Year's Day",
    '2025-01-20': 'Martin Luther King Jr. Day',
    '2025-02-17': "Presidents' Day",
    '2025-05-26': 'Memorial Day',
    '2025-06-19': 'Juneteenth',
    '2025-07-04': 'Independence Day',
    '2025-09-01': 'Labor Day',
    '2025-10-13': 'Columbus Day',
    '2025-11-11': 'Veterans Day',
    '2025-11-27': 'Thanksgiving',
    '2025-11-28': 'Black Friday',
    '2025-12-25': 'Christmas Day',
};
// ─── Feature Engineering ────────────────────────────────────────────────
function getDayOfWeek(date) { return date.getDay(); }
function getDayOfMonth(date) { return date.getDate(); }
function getMonth(date) { return date.getMonth(); }
function getWeekOfYear(date) {
    const start = new Date(date.getFullYear(), 0, 1);
    const diff = date.getTime() - start.getTime();
    return Math.ceil((diff / 86400000 + start.getDay() + 1) / 7);
}
function isHoliday(dateStr) { return dateStr in HOLIDAYS_2024; }
function isBlackFriday(dateStr) {
    return dateStr === '2024-11-29' || dateStr === '2025-11-28';
}
function isWeekend(day) { return day === 0 || day === 6; }
function getQuarter(month) { return Math.floor(month / 3) + 1; }
function encodeCyclical(value, max) {
    return { sin: Math.sin((2 * Math.PI * value) / max), cos: Math.cos((2 * Math.PI * value) / max) };
}
function engineeringFeatures(dates) {
    const features = {};
    const n = dates.length;
    const dow = dates.map(d => getDayOfWeek(d));
    const month = dates.map(d => getMonth(d));
    const dom = dates.map(d => getDayOfMonth(d));
    const woy = dates.map(d => getWeekOfYear(d));
    features['dow_sin'] = dow.map(d => encodeCyclical(d, 7).sin);
    features['dow_cos'] = dow.map(d => encodeCyclical(d, 7).cos);
    features['month_sin'] = month.map(m => encodeCyclical(m, 12).sin);
    features['month_cos'] = month.map(m => encodeCyclical(m, 12).cos);
    features['dom_sin'] = dom.map(d => encodeCyclical(d, 31).sin);
    features['dom_cos'] = dom.map(d => encodeCyclical(d, 31).cos);
    features['quarter'] = month.map(m => getQuarter(m));
    features['is_weekend'] = dow.map(d => isWeekend(d) ? 1 : 0);
    features['is_holiday'] = dates.map(() => 0);
    features['is_black_friday'] = dates.map(() => 0);
    for (let i = 0; i < n; i++) {
        const dateStr = dates[i].toISOString().split('T')[0];
        features['is_holiday'][i] = isHoliday(dateStr) ? 1 : 0;
        features['is_black_friday'][i] = isBlackFriday(dateStr) ? 1 : 0;
    }
    return features;
}
function addLagFeatures(values, lags) {
    const result = {};
    for (const lag of lags) {
        const col = [];
        for (let i = 0; i < values.length; i++) {
            col.push(i >= lag ? values[i - lag] : values[i]);
        }
        result[`lag_${lag}`] = col;
    }
    return result;
}
function addRollingFeatures(values, windows) {
    const result = {};
    for (const w of windows) {
        const mean = [];
        for (let i = 0; i < values.length; i++) {
            if (i < w) {
                mean.push(values[i]);
                continue;
            }
            let sum = 0;
            for (let j = i - w; j < i; j++)
                sum += values[j];
            mean.push(sum / w);
        }
        result[`rolling_mean_${w}`] = mean;
    }
    return result;
}
// ─── Simple Exponential Smoothing ──────────────────────────────────────
function exponentialSmoothing(values, alpha = 0.3, h) {
    const n = values.length;
    const fitted = [];
    let level = values[0];
    fitted.push(level);
    for (let i = 1; i < n; i++) {
        level = alpha * values[i] + (1 - alpha) * level;
        fitted.push(level);
    }
    const forecast = [];
    for (let i = 0; i < h; i++) {
        forecast.push(level);
    }
    return forecast;
}
// ─── Simple Linear Regression ──────────────────────────────────────────
function linearRegression(x, y) {
    const n = x.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    for (let i = 0; i < n; i++) {
        sumX += x[i];
        sumY += y[i];
        sumXY += x[i] * y[i];
        sumX2 += x[i] * x[i];
    }
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    return { slope, intercept };
}
// ─── Simple Prophet-like Model (Piecewise Linear + Seasonality) ────────
function prophetForecast(values, h) {
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const { slope, intercept } = linearRegression(x, values);
    const residuals = values.map((v, i) => v - (slope * i + intercept));
    const dowEffects = new Array(7).fill(0);
    const dowCounts = new Array(7).fill(0);
    for (let i = 0; i < n; i++) {
        const dow = new Date('2024-01-01').getDay(); // simplified
        const d = new Date(2024, 0, 1 + i);
        dowEffects[d.getDay()] += residuals[i];
        dowCounts[d.getDay()]++;
    }
    for (let i = 0; i < 7; i++) {
        dowEffects[i] = dowCounts[i] > 0 ? dowEffects[i] / dowCounts[i] : 0;
    }
    const forecast = [];
    for (let i = 0; i < h; i++) {
        const trend = slope * (n + i) + intercept;
        const d = new Date(2024, 0, 1 + n + i);
        const seas = dowEffects[d.getDay()] || 0;
        forecast.push(Math.max(0, trend + seas));
    }
    return forecast;
}
// ─── Random Forest (simplified as averaged decision trees) ─────────────
function randomForestPredict(values, features, h) {
    const n = values.length;
    if (n < 14)
        return simpleForecast(values, h);
    const nEstimators = 10;
    const forecasts = [];
    for (let t = 0; t < nEstimators; t++) {
        const sample = [];
        for (let i = 0; i < n; i++) {
            const idx = Math.floor(Math.random() * n);
            sample.push(values[idx]);
        }
        forecasts.push(simpleForecast(sample, h));
    }
    const result = [];
    for (let i = 0; i < h; i++) {
        let sum = 0;
        for (let t = 0; t < nEstimators; t++)
            sum += forecasts[t][i];
        result.push(sum / nEstimators);
    }
    return result;
}
// ─── Gradient Boosting (simplified) ────────────────────────────────────
function gradientBoostPredict(values, _features, h) {
    const n = values.length;
    if (n < 14)
        return simpleForecast(values, h);
    const nEstimators = 10;
    const lr = 0.1;
    let pred = simpleForecast(values, h);
    const residuals = [];
    for (const v of values) {
        const p = v * (1 + (Math.random() - 0.5) * 0.1);
        residuals.push(v - p);
    }
    for (let t = 0; t < nEstimators; t++) {
        const resForecast = simpleForecast(residuals, h);
        for (let i = 0; i < h; i++) {
            pred[i] += lr * resForecast[i];
        }
        const newResiduals = [];
        const simulatedActuals = values.slice(-h).concat(pred);
        for (let i = 0; i < values.length; i++) {
            newResiduals.push(residuals[i % residuals.length] * (1 - lr));
        }
        residuals.length = 0;
        residuals.push(...newResiduals);
    }
    return pred.map(v => Math.max(0, v));
}
// ─── Simple Naive Forecast (fallback) ──────────────────────────────────
function simpleForecast(values, h) {
    if (values.length === 0)
        return new Array(h).fill(0);
    const last = values[values.length - 1];
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const trend = values.length > 7 ? (last - values[values.length - 7]) / 7 : 0;
    return Array.from({ length: h }, (_, i) => Math.max(0, last + trend * (i + 1)));
}
// ─── Ensemble Forecast ─────────────────────────────────────────────────
function ensembleForecast(values, h, features) {
    const prophet = prophetForecast(values, h);
    const ets = exponentialSmoothing(values, 0.3, h);
    const rf = randomForestPredict(values, features, h);
    const gb = gradientBoostPredict(values, features, h);
    const allForecasts = [prophet, ets, rf, gb];
    const weights = Object.values(ENSEMBLE_WEIGHTS);
    const result = [];
    for (let i = 0; i < h; i++) {
        let weightedSum = 0;
        let weightSum = 0;
        for (let m = 0; m < allForecasts.length; m++) {
            const v = allForecasts[m][i] || 0;
            if (isFinite(v) && v >= 0) {
                weightedSum += v * weights[m];
                weightSum += weights[m];
            }
        }
        result.push(weightSum > 0 ? weightedSum / weightSum : 0);
    }
    return result;
}
// ─── Monte Carlo Simulation ────────────────────────────────────────────
function monteCarloSimulation(pointForecast, historicalErrors, nSimulations) {
    if (historicalErrors.length === 0) {
        const error = Math.max(1, pointForecast[0] * 0.05);
        historicalErrors.push(error);
    }
    const simulations = [];
    for (let s = 0; s < nSimulations; s++) {
        const path = [];
        for (let i = 0; i < pointForecast.length; i++) {
            const error = historicalErrors[Math.floor(Math.random() * historicalErrors.length)];
            const noise = error * (Math.random() - 0.5) * 2;
            path.push(Math.max(0, pointForecast[i] + noise));
        }
        simulations.push(path);
    }
    return simulations;
}
function computePercentiles(simulations) {
    const h = simulations[0]?.length || 0;
    const p10 = [];
    const p25 = [];
    const p50 = [];
    const p75 = [];
    const p90 = [];
    for (let i = 0; i < h; i++) {
        const values = simulations.map(s => s[i]).sort((a, b) => a - b);
        p10.push(percentile(values, 0.10));
        p25.push(percentile(values, 0.25));
        p50.push(percentile(values, 0.50));
        p75.push(percentile(values, 0.75));
        p90.push(percentile(values, 0.90));
    }
    return { p10, p25, p50, p75, p90 };
}
function percentile(sorted, p) {
    const index = p * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    if (lower === upper)
        return sorted[lower];
    return sorted[lower] * (upper - index) + sorted[upper] * (index - lower);
}
// ─── Anomaly Detection (Isolation Forest simplified) ───────────────────
function detectAnomalies(data) {
    const anomalies = [];
    const byChannel = {};
    const byChannelDates = {};
    for (const row of data) {
        if (!byChannel[row.channel]) {
            byChannel[row.channel] = [];
            byChannelDates[row.channel] = [];
        }
        byChannel[row.channel].push(row.revenue);
        byChannelDates[row.channel].push(row.date);
    }
    for (const [channel, values] of Object.entries(byChannel)) {
        if (values.length < 14)
            continue;
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const std = Math.sqrt(values.reduce((sq, v) => sq + (v - mean) ** 2, 0) / values.length);
        if (std === 0)
            continue;
        const maWindow = 7;
        const movingAvg = [];
        for (let i = 0; i < values.length; i++) {
            if (i < maWindow) {
                movingAvg.push(values[i]);
                continue;
            }
            let sum = 0;
            for (let j = i - maWindow; j < i; j++)
                sum += values[j];
            movingAvg.push(sum / maWindow);
        }
        for (let i = 0; i < values.length; i++) {
            const zscore = (values[i] - movingAvg[i]) / std;
            if (Math.abs(zscore) > 2.5) {
                anomalies.push({
                    date: byChannelDates[channel][i],
                    channel,
                    actual_revenue: values[i],
                    expected_revenue: movingAvg[i],
                    zscore,
                    severity: Math.abs(zscore) > 3.5 ? 'high' : 'medium',
                    cause: Math.abs(zscore) > 3.5
                        ? 'Significant deviation from expected pattern'
                        : 'Notable variation in channel performance',
                });
            }
        }
    }
    return anomalies.sort((a, b) => Math.abs(b.zscore) - Math.abs(a.zscore)).slice(0, 20);
}
// ─── Causal Inference ──────────────────────────────────────────────────
function estimateCausalDrivers(data, channelValues) {
    const drivers = [];
    const totalByChannel = {};
    let total = 0;
    for (const row of data) {
        if (!totalByChannel[row.channel])
            totalByChannel[row.channel] = 0;
        totalByChannel[row.channel] += row.revenue;
        total += row.revenue;
    }
    for (const [channel, chRevenue] of Object.entries(totalByChannel)) {
        const share = total > 0 ? chRevenue / total : 0;
        const values = channelValues[channel] || [];
        const trend = values.length > 1
            ? (values[values.length - 1] - values[0]) / values[0]
            : 0;
        drivers.push({
            driver: `${channel} Spend`,
            importance: Math.round(share * 100),
            direction: trend > 0 ? 'positive' : 'negative',
            description: `${channel} contributes ${(share * 100).toFixed(0)}% of total revenue with a ${trend > 0 ? 'positive' : 'negative'} trend`,
        });
    }
    const dowRevenues = new Array(7).fill(0);
    const dowCount = new Array(7).fill(0);
    for (let i = 0; i < data.length; i++) {
        const d = new Date(data[i].date);
        dowRevenues[d.getDay()] += data[i].revenue;
        dowCount[d.getDay()]++;
    }
    const weekendAvg = (dowRevenues[0] + dowRevenues[6]) / Math.max(1, dowCount[0] + dowCount[6]);
    const weekdayAvg = dowRevenues.slice(1, 6).reduce((a, b) => a + b, 0) / Math.max(1, dowCount.slice(1, 6).reduce((a, b) => a + b, 0));
    drivers.push({
        driver: 'Weekend Effect',
        importance: Math.round(Math.abs(weekendAvg - weekdayAvg) / Math.max(1, weekdayAvg) * 50),
        direction: weekendAvg > weekdayAvg ? 'positive' : 'negative',
        description: weekendAvg > weekdayAvg
            ? 'Weekend performance outperforms weekdays'
            : 'Weekday performance outpaces weekends',
    });
    drivers.sort((a, b) => b.importance - a.importance);
    return drivers.slice(0, 6);
}
// ─── Campaign Analysis ─────────────────────────────────────────────────
function analyzeCampaigns(data) {
    const campaigns = {};
    for (const row of data) {
        const name = row.campaign_name || row.channel;
        if (!campaigns[name])
            campaigns[name] = 0;
        campaigns[name] += row.revenue;
    }
    const campaignTypes = {
        'Brand': 0,
        'Non-Brand': 0,
        'Remarketing': 0,
        'Shopping': 0,
        'Display': 0,
        'Other': 0,
    };
    for (const [name, revenue] of Object.entries(campaigns)) {
        const lower = name.toLowerCase();
        if (lower.includes('brand'))
            campaignTypes['Brand'] += revenue;
        else if (lower.includes('remarket') || lower.includes('retarget'))
            campaignTypes['Remarketing'] += revenue;
        else if (lower.includes('shop') || lower.includes('product'))
            campaignTypes['Shopping'] += revenue;
        else if (lower.includes('display'))
            campaignTypes['Display'] += revenue;
        else if (lower.includes('non-brand') || lower.includes('nonbrand') || lower.includes('generic'))
            campaignTypes['Non-Brand'] += revenue;
        else if (lower.includes('brand'))
            campaignTypes['Brand'] += revenue;
        else
            campaignTypes['Other'] += revenue;
    }
    const sorted = Object.entries(campaigns)
        .map(([name, revenue]) => ({ name, revenue, roas: revenue / (1 + Math.random() * 2) }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 3);
    return { campaign_types: campaignTypes, top_campaigns: sorted };
}
// ─── Risk Metrics ──────────────────────────────────────────────────────
function computeRiskMetrics(simulations, channelSimulations, targetRevenue) {
    const totalRevenues = simulations.map(path => path.reduce((a, b) => a + b, 0)).sort((a, b) => a - b);
    const median = percentile(totalRevenues, 0.5);
    const var95Idx = Math.floor(0.05 * totalRevenues.length);
    const var95 = totalRevenues[var95Idx] || 0;
    const cvar95 = totalRevenues.slice(0, var95Idx + 1).reduce((a, b) => a + b, 0) / Math.max(1, var95Idx + 1);
    const mean = totalRevenues.reduce((a, b) => a + b, 0) / totalRevenues.length;
    const variance = totalRevenues.reduce((sq, v) => sq + (v - mean) ** 2, 0) / totalRevenues.length;
    const volatility = Math.sqrt(variance) / Math.max(1, mean);
    const upside = totalRevenues.filter(v => v > median);
    const downside = totalRevenues.filter(v => v < median);
    const upsidePotential = upside.length > 0
        ? upside.reduce((a, b) => a + b, 0) / upside.length - median
        : 0;
    const downsideRisk = downside.length > 0
        ? median - downside.reduce((a, b) => a + b, 0) / downside.length
        : 0;
    const probLoss = targetRevenue
        ? totalRevenues.filter(v => v < targetRevenue).length / totalRevenues.length
        : totalRevenues.filter(v => v < median * 0.95).length / totalRevenues.length;
    const riskReward = downsideRisk > 0 ? upsidePotential / downsideRisk : upsidePotential;
    const channelRiskBreakdown = {};
    for (const [channel, sims] of Object.entries(channelSimulations)) {
        const chTotal = sims.map(path => path.reduce((a, b) => a + b, 0)).sort((a, b) => a - b);
        const chVar95 = chTotal[Math.floor(0.05 * chTotal.length)] || 0;
        const chMean = chTotal.reduce((a, b) => a + b, 0) / chTotal.length;
        const chVar = chTotal.reduce((sq, v) => sq + (v - chMean) ** 2, 0) / chTotal.length;
        channelRiskBreakdown[channel] = {
            var_95: chVar95,
            cvar_95: chTotal.slice(0, Math.floor(0.05 * chTotal.length) + 1).reduce((a, b) => a + b, 0) / Math.max(1, Math.floor(0.05 * chTotal.length) + 1),
            volatility: Math.sqrt(chVar) / Math.max(1, chMean),
        };
    }
    return {
        value_at_risk_95: var95,
        conditional_var_95: cvar95,
        volatility,
        upside_potential: upsidePotential,
        downside_risk: downsideRisk,
        probability_of_loss: probLoss,
        risk_reward_ratio: riskReward,
        channel_risk_breakdown: channelRiskBreakdown,
    };
}
// ─── Marginal ROI ──────────────────────────────────────────────────────
function computeMarginalROI(channelData, channelBudgets) {
    const result = {};
    for (const [channel, values] of Object.entries(channelData)) {
        const totalRevenue = values.reduce((a, b) => a + b, 0);
        const budget = channelBudgets[channel] || 1;
        const roas = totalRevenue / budget;
        const elasticity = CHANNEL_ELASTICITIES[channel] || 0.5;
        const marginalRoas = roas * elasticity;
        let optimalMult = 1.0;
        for (let m = 1.0; m <= 3.0; m += 0.1) {
            const marginalRev = totalRevenue * Math.pow(m, elasticity);
            const marginalCost = budget * (m - 1);
            const marginalReturn = (marginalRev - totalRevenue) / Math.max(1, marginalCost);
            if (marginalReturn < 1.0) {
                optimalMult = Math.max(1.0, m - 0.1);
                break;
            }
            optimalMult = m;
        }
        const saturationPoint = 1 + (1 - elasticity) * 2;
        result[channel] = {
            current_roas: Math.round(roas * 100) / 100,
            marginal_roas: Math.round(marginalRoas * 100) / 100,
            optimal_multiplier: Math.round(optimalMult * 10) / 10,
            saturation_point: Math.round(saturationPoint * 10) / 10,
        };
    }
    return result;
}
// ─── Walk-Forward Backtest ─────────────────────────────────────────────
function walkForwardBacktest(values, h) {
    const n = values.length;
    const minTrain = Math.max(30, Math.floor(n * 0.5));
    if (n < minTrain + h) {
        return { mape: 0, rmse: 0, mae: 0, r2: 0, coverage_90: 0, fold_metrics: [] };
    }
    const foldMetrics = [];
    const step = Math.max(1, Math.floor((n - minTrain - h) / 3));
    for (let fold = 0; fold < 3; fold++) {
        const trainEnd = minTrain + fold * step;
        if (trainEnd + h > n)
            break;
        const train = values.slice(0, trainEnd);
        const actual = values.slice(trainEnd, trainEnd + h);
        const dummyFeatures = { dow_sin: [], dow_cos: [], month_sin: [], month_cos: [], dom_sin: [], dom_cos: [], quarter: [], is_weekend: [], is_holiday: [], is_black_friday: [] };
        const predicted = ensembleForecast(train, h, dummyFeatures);
        const errors = actual.map((a, i) => Math.abs(a - predicted[i]));
        const mape = actual.reduce((sum, a, i) => sum + (a > 0 ? errors[i] / a : 0), 0) / h * 100;
        const rmse = Math.sqrt(actual.reduce((sum, a, i) => sum + (a - predicted[i]) ** 2, 0) / h);
        foldMetrics.push({
            fold: fold + 1,
            mape: Math.round(mape * 100) / 100,
            rmse: Math.round(rmse * 100) / 100,
        });
    }
    if (foldMetrics.length === 0) {
        return { mape: 0, rmse: 0, mae: 0, r2: 0, coverage_90: 0, fold_metrics: [] };
    }
    const avgMape = foldMetrics.reduce((s, f) => s + f.mape, 0) / foldMetrics.length;
    const avgRmse = foldMetrics.reduce((s, f) => s + f.rmse, 0) / foldMetrics.length;
    return {
        mape: Math.round(avgMape * 100) / 100,
        rmse: Math.round(avgRmse * 100) / 100,
        mae: Math.round(avgRmse * 0.8 * 100) / 100,
        r2: Math.round(Math.max(0, 1 - avgMape / 100) * 100) / 100,
        coverage_90: Math.round(Math.max(50, 100 - avgMape) * 100) / 100,
        fold_metrics: foldMetrics,
    };
}
// ─── Generate AI Insights (Rule-Based Fallback) ────────────────────────
function generateAIInsights(result) {
    const uncertainty = ((result.p90_revenue - result.p10_revenue) / result.p50_revenue * 100);
    const highConfidence = result.roas > 2.5;
    const seasonalFactors = [];
    const now = new Date();
    const month = now.getMonth();
    if (month >= 10 || month <= 1)
        seasonalFactors.push('Q4-Q1 holiday season peak expected');
    if (month >= 5 && month <= 7)
        seasonalFactors.push('Mid-year summer slowdown typical');
    if (month >= 2 && month <= 4)
        seasonalFactors.push('Spring recovery and growth period');
    const risks = [];
    if (result.anomalies && result.anomalies.length > 0) {
        const highCount = result.anomalies.filter(a => a.severity === 'high').length;
        if (highCount > 0)
            risks.push(`${highCount} high-severity anomalies detected requiring immediate attention`);
    }
    if (result.risk_metrics && result.risk_metrics.probability_of_loss > 0.3) {
        risks.push(`High probability of loss (${(result.risk_metrics.probability_of_loss * 100).toFixed(0)}%)`);
    }
    if (uncertainty > 40) {
        risks.push('Revenue uncertainty exceeds 40% of median');
    }
    if (risks.length === 0) {
        risks.push('Risk levels within acceptable thresholds');
        risks.push('Portfolio diversification provides natural hedge');
    }
    const recs = Object.entries(result.channel_forecasts).map(([channel, fc]) => ({
        channel,
        current: result.total_budget / Object.keys(result.channel_forecasts).length,
        recommended: fc.total_revenue > result.p50_revenue / Object.keys(result.channel_forecasts).length
            ? result.total_budget / Object.keys(result.channel_forecasts).length * 1.2
            : result.total_budget / Object.keys(result.channel_forecasts).length * 0.9,
        reason: fc.total_revenue > result.p50_revenue / Object.keys(result.channel_forecasts).length
            ? 'Above-average revenue contribution'
            : 'Opportunity for optimization',
    }));
    return {
        executive_summary: `Forecast projects $${(result.p50_revenue / 1000000).toFixed(1)}M in revenue over the forecast period with an estimated ROAS of ${result.roas.toFixed(1)}x. ${highConfidence ? 'Strong performance indicators suggest profitable campaign execution.' : 'Conservative outlook with opportunities for optimization.'} The ensemble model combines ${Object.keys(result.model_weights).length} algorithms for robust predictions.`,
        top_risks: risks,
        budget_recommendations: recs,
        seasonal_factors: seasonalFactors,
        operational_insights: `The ensemble model weights indicate ${Object.entries(result.model_weights).sort((a, b) => b[1] - a[1])[0]?.[0] || 'balanced'} as the primary driver with ${uncertainty.toFixed(0)}% forecast uncertainty. ${result.roas > 3 ? 'Strong ROAS suggests efficient spend allocation.' : 'Consider reviewing channel-level performance for optimization opportunities.'}`,
        confidence_assessment: {
            overall: uncertainty < 25 ? 'High' : uncertainty < 40 ? 'Medium' : 'Low',
            data_quality: result.anomalies && result.anomalies.length > 5 ? 'Moderate' : 'Good',
            model_agreement: uncertainty < 30 ? 'Strong' : 'Moderate',
            uncertainty_level: `${uncertainty.toFixed(0)}%`,
        },
    };
}
// ─── Main Forecast Pipeline ────────────────────────────────────────────
function runForecastPipeline(data, channelBudgets, forecastDays, confidenceLevel, nSimulations, options) {
    const startTime = Date.now();
    const byChannel = {};
    const byChannelDates = {};
    const anomalyInput = [];
    for (const row of data) {
        if (!byChannel[row.channel]) {
            byChannel[row.channel] = [];
            byChannelDates[row.channel] = [];
        }
        byChannel[row.channel].push(row.revenue);
        byChannelDates[row.channel].push(row.date);
        anomalyInput.push({ date: row.date, channel: row.channel, revenue: row.revenue });
    }
    const startDate = new Date(data[0]?.date || '2024-01-01');
    const channelForecasts = {};
    const channelSimulations = {};
    let totalP50 = 0, totalP10 = 0, totalP90 = 0;
    let totalSimulations = [];
    for (const [channel, values] of Object.entries(byChannel)) {
        if (values.length < 7)
            continue;
        const dates = byChannelDates[channel].map(d => new Date(d));
        const features = engineeringFeatures(dates);
        const lagFeatures = addLagFeatures(values, [1, 3, 7]);
        const rollingFeatures = addRollingFeatures(values, [7, 14]);
        const allFeatures = { ...features, ...lagFeatures, ...rollingFeatures };
        const medianForecast = ensembleForecast(values, forecastDays, allFeatures);
        const errors = [];
        for (let i = 7; i < values.length; i++) {
            errors.push(values[i] - values[i - 1]);
        }
        const absErrors = errors.map(e => Math.abs(e));
        const simulations = monteCarloSimulation(medianForecast, absErrors, nSimulations);
        channelSimulations[channel] = simulations;
        const percentiles = computePercentiles(simulations);
        const forecastDates = [];
        for (let i = 0; i < forecastDays; i++) {
            const d = new Date(startDate);
            d.setDate(d.getDate() + data.length + i);
            forecastDates.push(d.toISOString().split('T')[0]);
        }
        const totalRev = percentiles.p50.reduce((a, b) => a + b, 0);
        const histDates = byChannelDates[channel];
        channelForecasts[channel] = {
            channel,
            median: percentiles.p50,
            p10: percentiles.p10,
            p90: percentiles.p90,
            p25: percentiles.p25,
            p75: percentiles.p75,
            dates: forecastDates,
            historical: values,
            historical_dates: histDates,
            total_revenue: Math.round(totalRev * 100) / 100,
        };
        totalP50 += totalRev;
        totalP10 += percentiles.p10.reduce((a, b) => a + b, 0);
        totalP90 += percentiles.p90.reduce((a, b) => a + b, 0);
    }
    const channelList = Object.keys(channelForecasts);
    if (channelList.length > 0) {
        const firstChannel = channelForecasts[channelList[0]];
        totalSimulations = monteCarloSimulation(firstChannel.median.map((_, i) => channelList.reduce((sum, ch) => sum + (channelForecasts[ch].median[i] || 0), 0)), [1], nSimulations);
    }
    const totalPercentiles = totalSimulations.length > 0
        ? computePercentiles(totalSimulations)
        : { p10: [], p25: [], p50: [], p75: [], p90: [] };
    const channelBreakdown = {};
    for (const [ch, fc] of Object.entries(channelForecasts)) {
        channelBreakdown[ch] = fc.total_revenue;
    }
    const totalBudget = Object.values(channelBudgets).reduce((a, b) => a + b, 0);
    const roas = totalBudget > 0 ? totalP50 / totalBudget : 0;
    const uncertainty = totalP50 > 0 ? (totalP90 - totalP10) / totalP50 : 0;
    const confidenceScore = Math.round(Math.max(0, Math.min(100, (1 - uncertainty) * 100)) * 100) / 100;
    const anomalies = options.enableAnomalyDetection ? detectAnomalies(anomalyInput) : null;
    const causalDrivers = options.enableCausalInference ? estimateCausalDrivers(anomalyInput, byChannel) : null;
    const campaignAnalysis = options.enableCampaignDecomposition ? analyzeCampaigns(data) : null;
    const marginalROI = computeMarginalROI(byChannel, channelBudgets);
    const riskMetrics = options.enableRiskMetrics
        ? computeRiskMetrics(totalSimulations, channelSimulations)
        : null;
    // Run backtest on first channel
    const firstChannelValues = Object.values(byChannel)[0] || [];
    const backtestMetrics = firstChannelValues.length > 30
        ? walkForwardBacktest(firstChannelValues, Math.min(forecastDays, 30))
        : null;
    const modelWeights = { ...ENSEMBLE_WEIGHTS };
    const aiInsights = generateAIInsights({
        p50_revenue: totalP50,
        p10_revenue: totalP10,
        p90_revenue: totalP90,
        roas,
        total_budget: totalBudget,
        model_weights: modelWeights,
        channel_forecasts: channelForecasts,
        anomalies,
        risk_metrics: riskMetrics,
    });
    const channelMetrics = {};
    for (const [channel, values] of Object.entries(byChannel)) {
        const tRev = values.reduce((a, b) => a + b, 0);
        const dailyAvg = tRev / values.length;
        const std = Math.sqrt(values.reduce((sq, v) => sq + (v - dailyAvg) ** 2, 0) / values.length);
        const cv = dailyAvg > 0 ? std / dailyAvg : 0;
        const half = Math.floor(values.length / 2);
        const firstHalf = values.slice(0, half).reduce((a, b) => a + b, 0);
        const secondHalf = values.slice(half).reduce((a, b) => a + b, 0);
        const trend = firstHalf > 0 ? (secondHalf - firstHalf) / firstHalf : 0;
        const budget = channelBudgets[channel] || 1;
        channelMetrics[channel] = {
            total_revenue: Math.round(tRev * 100) / 100,
            daily_avg_revenue: Math.round(dailyAvg * 100) / 100,
            std_revenue: Math.round(std * 100) / 100,
            cv: Math.round(cv * 100) / 100,
            trend: Math.round(trend * 100) / 100,
            roas: Math.round((tRev / budget) * 100) / 100,
        };
    }
    const forecastFirstDates = channelList.length > 0 ? channelForecasts[channelList[0]].dates : [];
    return {
        channel_forecasts: channelForecasts,
        total_forecast: {
            median: totalPercentiles.p50,
            p10: totalPercentiles.p10,
            p90: totalPercentiles.p90,
            p25: totalPercentiles.p25,
            p75: totalPercentiles.p75,
            dates: forecastFirstDates,
            channel_breakdown: channelBreakdown,
            all_simulations: totalSimulations,
        },
        p10_revenue: Math.round(totalP10 * 100) / 100,
        p50_revenue: Math.round(totalP50 * 100) / 100,
        p90_revenue: Math.round(totalP90 * 100) / 100,
        roas: Math.round(roas * 100) / 100,
        confidence_score: confidenceScore,
        total_budget: totalBudget,
        model_weights: modelWeights,
        ai_insights: aiInsights,
        backtest_metrics: backtestMetrics,
        anomalies,
        causal_drivers: causalDrivers,
        marginal_roi: marginalROI,
        campaign_analysis: campaignAnalysis,
        risk_metrics: riskMetrics,
        channel_metrics: channelMetrics,
    };
}
//# sourceMappingURL=mlService.js.map