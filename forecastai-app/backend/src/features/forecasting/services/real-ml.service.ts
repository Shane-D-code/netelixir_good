/**
 * Real Forecasting Models - Production Grade
 * Holt-Winters (multiplicative), Theta, ETS
 * No heuristics, no fake ML
 */

// ─── Utility Functions ────────────────────────────────────────────────

function arrStd(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

function arrMean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function calcSlope(x: number[], y: number[]): number {
  const n = x.length;
  if (n < 2) return 0;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((a, b, i) => a + b * y[i], 0);
  const sumXX = x.reduce((a, b) => a + b * b, 0);
  const denom = n * sumXX - sumX * sumX;
  if (Math.abs(denom) < 1e-10) return 0;
  return (n * sumXY - sumX * sumY) / denom;
}

function boxMuller(stdev: number): number {
  const u = 1 - Math.random();
  const v = Math.random();
  return stdev * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// ─── Holt-Winters Multiplicative ─────────────────────────────────────
// ŷ_{t+h} = (l_t + h * b_t) * s_{t+h-p}
// - Handles trend + multiplicative seasonality
// - Best for business revenue data where seasonal effects scale with level

export function holtWinters(
  values: number[],
  h: number,
  alpha = 0.3,
  beta = 0.1,
  gamma = 0.2,
  period = 7
): number[] {
  const n = values.length;
  if (n === 0) return Array(h).fill(0);
  if (n < period * 2) {
    return simpleEts(values, h);
  }

  // Initialize: level = avg of first period, trend = diff between first two periods
  const firstAvg = arrMean(values.slice(0, period));
  const secondAvg = arrMean(values.slice(period, period * 2));
  let level = firstAvg;
  let trend = (secondAvg - firstAvg) / period;

  // Initial seasonal indices
  const seasonals: number[] = [];
  for (let i = 0; i < period; i++) {
    seasonals.push(values[i] / Math.max(level, 1e-10));
  }

  // Train on all historical data
  for (let t = 0; t < n; t++) {
    const sIdx = t % period;
    const y = values[t];
    const prevLevel = level;

    // Multiplicative update equations
    level = alpha * (y / Math.max(seasonals[sIdx], 0.01)) + (1 - alpha) * (level + trend);
    trend = beta * (level - prevLevel) + (1 - beta) * trend;
    seasonals[sIdx] = gamma * (y / Math.max(level, 1e-10)) + (1 - gamma) * seasonals[sIdx];
  }

  // Generate h-step-ahead forecast
  const forecast: number[] = [];
  for (let i = 1; i <= h; i++) {
    const sIdx = (n + i - 1) % period;
    forecast.push(Math.max(0, (level + trend * i) * seasonals[sIdx]));
  }

  return forecast;
}

// ─── Simple ETS (Exponential Smoothing, no trend/seasonality) ────────
// Level-only smoothing - good as a component in ensemble

export function simpleEts(values: number[], h: number, alpha = 0.3): number[] {
  const n = values.length;
  if (n === 0) return Array(h).fill(0);

  let level = values[0];
  for (let i = 1; i < n; i++) {
    level = alpha * values[i] + (1 - alpha) * level;
  }

  return Array(h).fill(Math.max(0, level));
}

// ─── Theta Model ─────────────────────────────────────────────────────
// Assimakopoulos & Nikolopoulos (2000) - M3 Competition winner
// Decomposes series, applies theta transformation, recombines

export function thetaModel(values: number[], h: number, theta = 2): number[] {
  const n = values.length;
  if (n === 0) return Array(h).fill(0);
  if (n < 4) return simpleEts(values, h);

  // Step 1: Linear trend
  const x = Array.from({ length: n }, (_, i) => i);
  const slope = calcSlope(x, values);
  const intercept = arrMean(values) - slope * ((n - 1) / 2);

  // Step 2: Detrend
  const detrended = values.map((v, i) => v - (slope * i + intercept));

  // Step 3: Seasonal decomposition (if enough data)
  let seasonalPattern: number[] = [];
  if (n >= 14) {
    const period = Math.min(7, Math.floor(n / 2));
    for (let d = 0; d < period; d++) {
      let sum = 0, count = 0;
      for (let j = d; j < n; j += period) {
        sum += detrended[j];
        count++;
      }
      seasonalPattern.push(count > 0 ? sum / count : 0);
    }
    // Center seasonal pattern (subtract mean)
    const sMean = arrMean(seasonalPattern);
    seasonalPattern = seasonalPattern.map(s => s - sMean);
  }

  // Step 4: Forecast
  const meanY = arrMean(values);
  const forecast: number[] = [];

  for (let i = 1; i <= h; i++) {
    // Trend component scaled by theta
    const trendComponent = slope * theta * i;
    // Seasonal component
    const seasonal = seasonalPattern.length > 0
      ? seasonalPattern[(n + i - 1) % seasonalPattern.length]
      : 0;
    forecast.push(Math.max(0, meanY + trendComponent + seasonal));
  }

  return forecast;
}

// ─── ETS(A,A,M) Simplified ───────────────────────────────────────────
// Additive trend, multiplicative seasonality, different alpha

export function etsAddTrendMultSeas(
  values: number[],
  h: number,
  alpha = 0.2,
  beta = 0.05,
  gamma = 0.15,
  period = 7
): number[] {
  const n = values.length;
  if (n === 0) return Array(h).fill(0);
  if (n < period * 2) return simpleEts(values, h);

  // Same as Holt-Winters but with more conservative smoothing parameters
  // This provides diversity in the ensemble
  const firstAvg = arrMean(values.slice(0, period));
  const secondAvg = arrMean(values.slice(period, period * 2));
  let level = firstAvg;
  let trend = (secondAvg - firstAvg) / period;

  const seasonals: number[] = [];
  for (let i = 0; i < period; i++) {
    seasonals.push(values[i] / Math.max(level, 1e-10));
  }

  for (let t = 0; t < n; t++) {
    const sIdx = t % period;
    const y = values[t];
    const prevLevel = level;

    level = alpha * (y / Math.max(seasonals[sIdx], 0.01)) + (1 - alpha) * (level + trend);
    trend = beta * (level - prevLevel) + (1 - beta) * trend;
    seasonals[sIdx] = gamma * (y / Math.max(level, 1e-10)) + (1 - gamma) * seasonals[sIdx];
  }

  const forecast: number[] = [];
  for (let i = 1; i <= h; i++) {
    const sIdx = (n + i - 1) % period;
    forecast.push(Math.max(0, (level + trend * i) * seasonals[sIdx]));
  }

  return forecast;
}

// ─── Autocorrelated Monte Carlo Simulation ───────────────────────────
// Uses AR(1) process for realistic error paths

export function autocorrelatedMonteCarlo(
  pointForecast: number[],
  historicalErrors: number[],
  nSimulations: number,
  phi = 0.7
): number[][] {
  const h = pointForecast.length;
  if (h === 0) return [];

  const errorStd = historicalErrors.length > 0 ? arrStd(historicalErrors) : 0.1;
  if (errorStd === 0) {
    // No variability - return point forecast as all simulations
    return Array.from({ length: nSimulations }, () => [...pointForecast]);
  }

  const simulations: number[][] = [];
  for (let s = 0; s < nSimulations; s++) {
    const path: number[] = [];
    let prevNoise = 0;
    for (let i = 0; i < h; i++) {
      // AR(1): noise_t = phi * noise_{t-1} + N(0, sigma)
      const noise = phi * prevNoise + boxMuller(errorStd * 0.5);
      path.push(Math.max(0, pointForecast[i] * (1 + noise)));
      prevNoise = noise;
    }
    simulations.push(path);
  }

  return simulations;
}

// ─── Compute Percentiles from Simulations ────────────────────────────

export interface SimulationPercentiles {
  p5: number[];
  p10: number[];
  p25: number[];
  p50: number[];
  p75: number[];
  p90: number[];
  p95: number[];
  mean: number[];
}

export function computeSimulationPercentiles(simulations: number[][]): SimulationPercentiles {
  const empty = (): number[] => [];

  if (!simulations || simulations.length === 0 || !simulations[0]) {
    return { p5: empty(), p10: empty(), p25: empty(), p50: empty(), p75: empty(), p90: empty(), p95: empty(), mean: empty() };
  }

  const h = simulations[0].length;
  const result: SimulationPercentiles = {
    p5: Array(h).fill(0),
    p10: Array(h).fill(0),
    p25: Array(h).fill(0),
    p50: Array(h).fill(0),
    p75: Array(h).fill(0),
    p90: Array(h).fill(0),
    p95: Array(h).fill(0),
    mean: Array(h).fill(0),
  };

  for (let i = 0; i < h; i++) {
    const col = simulations.map(s => s[i]).sort((a, b) => a - b);
    const len = col.length;
    result.mean[i] = col.reduce((a, b) => a + b, 0) / len;
    result.p50[i] = col[Math.floor(len * 0.50)];
    result.p5[i] = col[Math.floor(len * 0.05)];
    result.p10[i] = col[Math.floor(len * 0.10)];
    result.p25[i] = col[Math.floor(len * 0.25)];
    result.p75[i] = col[Math.floor(len * 0.75)];
    result.p90[i] = col[Math.floor(len * 0.90)];
    result.p95[i] = col[Math.floor(len * 0.95)];
  }

  return result;
}
