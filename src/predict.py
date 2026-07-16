#!/usr/bin/env python
"""
Prediction script for ForecastAI.
Loads a pickled StatsForecast ensemble and generates forecasts with Monte Carlo confidence intervals.
"""

import argparse
import json
import pickle
import time

import numpy as np
import pandas as pd


def detect_seasonality(values: np.ndarray) -> int:
    n = len(values)
    if n < 14:
        return 7

    max_lag = min(30, n // 2)
    mean = np.mean(values)
    var = np.var(values)
    if var == 0:
        return 7

    acf = np.zeros(max_lag + 1)
    acf[0] = 1.0
    for lag in range(1, max_lag + 1):
        if lag < n:
            c = np.corrcoef(values[:-lag], values[lag:])[0, 1]
            acf[lag] = c if not np.isnan(c) else 0.0

    best_period = 7
    best_val = 0.0
    for i in range(2, len(acf) - 1):
        if acf[i] > acf[i - 1] and acf[i] > acf[i + 1] and acf[i] > 0.15 and acf[i] > best_val:
            best_period = i
            best_val = acf[i]

    if best_period < 2 or best_period > 30:
        best_period = 7

    return best_period


def holt_winters_fallback(values: np.ndarray, days: int, period: int = 7) -> np.ndarray:
    n = len(values)
    if n < 2:
        return np.full(days, np.mean(values) if n > 0 else 0)
    if n < period * 2:
        alpha = 0.3
        level = values[0]
        for v in values[1:]:
            level = alpha * v + (1 - alpha) * level
        return np.full(days, max(0, level))

    first_avg = np.mean(values[:period])
    second_avg = np.mean(values[period:period * 2])
    level = first_avg
    trend = (second_avg - first_avg) / period
    seasonals = np.array(values[:period]) / max(level, 1e-10)

    for t in range(n):
        s_idx = t % period
        y = values[t]
        prev_level = level
        level = 0.3 * (y / max(seasonals[s_idx], 0.01)) + 0.7 * (level + trend)
        trend = 0.1 * (level - prev_level) + 0.9 * trend
        seasonals[s_idx] = 0.2 * (y / max(level, 1e-10)) + 0.8 * seasonals[s_idx]

    forecast = np.zeros(days)
    for i in range(days):
        s_idx = (n + i) % period
        forecast[i] = max(0, (level + trend * (i + 1)) * seasonals[s_idx])
    return forecast


def monte_carlo_simulation(point_forecast: np.ndarray, historical_values: np.ndarray,
                           n_simulations: int = 1000, phi: float = 0.7) -> dict:
    residuals = np.diff(historical_values) / (np.abs(historical_values[:-1]) + 1) if len(historical_values) > 1 else np.array([0.1])
    error_std = max(float(np.std(residuals)), 0.01)
    days = len(point_forecast)

    simulations = np.zeros((n_simulations, days))
    for s in range(n_simulations):
        prev_noise = 0.0
        for i in range(days):
            noise = phi * prev_noise + np.random.normal(0, error_std * 0.5)
            simulations[s, i] = max(0, point_forecast[i] * (1 + noise))
            prev_noise = noise

    return {
        "median": np.median(simulations, axis=0).tolist(),
        "mean": np.mean(simulations, axis=0).tolist(),
        "p5": np.percentile(simulations, 5, axis=0).tolist(),
        "p10": np.percentile(simulations, 10, axis=0).tolist(),
        "p25": np.percentile(simulations, 25, axis=0).tolist(),
        "p75": np.percentile(simulations, 75, axis=0).tolist(),
        "p90": np.percentile(simulations, 90, axis=0).tolist(),
        "p95": np.percentile(simulations, 95, axis=0).tolist(),
    }


def predict(features_path: str, model_path: str, output_path: str, forecast_days: int):
    start_time = time.time()

    features = pd.read_parquet(features_path)

    with open(model_path, "rb") as f:
        model_bundle = pickle.load(f)

    model_version = model_bundle.get("version", "1.0.0")
    model_weights = model_bundle.get("model_weights", {})
    sf_fitted = model_bundle.get("statsforecast_fitted")
    hw_params = model_bundle.get("holt_winters_params")

    channels = [c for c in features.columns if c.startswith("channel_")]
    channel_names = [c.replace("channel_", "") for c in channels]

    all_results = []

    for ch_col in channels:
        ch_name = ch_col.replace("channel_", "")
        ch_mask = features[ch_col] == 1
        ch_features = features[ch_mask].copy()

        if len(ch_features) < 7:
            continue

        ch_features = ch_features.sort_values("date").reset_index(drop=True)
        values = ch_features["revenue"].values.astype(float)
        season_length = detect_seasonality(values)

        point_forecast = None
        used_weights = {}

        if sf_fitted is not None and ch_name in sf_fitted:
            try:
                sf_obj = sf_fitted[ch_name]
                forecast_df = sf_obj.predict(h=forecast_days)

                model_cols = [c for c in forecast_df.columns if c not in ("ds", "unique_id")]
                if model_cols:
                    point_forecast = np.zeros(forecast_days)
                    for col in model_cols:
                        w = model_weights.get(ch_name, {}).get(col, 1.0 / len(model_cols))
                        fc = forecast_df[col].values[:forecast_days]
                        point_forecast += fc * w
                        used_weights[col] = round(w, 4)
            except Exception as e:
                print(f"  StatsForecast failed for {ch_name}: {e}")
                point_forecast = None

        if point_forecast is None:
            point_forecast = holt_winters_fallback(values, forecast_days, period=season_length)
            used_weights = {"Holt-Winters": 1.0}

        point_forecast = np.maximum(point_forecast, 0)

        mc = monte_carlo_simulation(point_forecast, values)

        dates = pd.to_datetime(ch_features["date"])
        last_date = dates.max()
        future_dates = pd.date_range(start=last_date + pd.Timedelta(days=1), periods=forecast_days)

        for i in range(forecast_days):
            all_results.append({
                "date": future_dates[i].strftime("%Y-%m-%d"),
                "channel": ch_name,
                "forecast_median": round(mc["median"][i], 2),
                "forecast_mean": round(mc["mean"][i], 2),
                "forecast_p5": round(mc["p5"][i], 2),
                "forecast_p10": round(mc["p10"][i], 2),
                "forecast_p25": round(mc["p25"][i], 2),
                "forecast_p75": round(mc["p75"][i], 2),
                "forecast_p90": round(mc["p90"][i], 2),
                "forecast_p95": round(mc["p95"][i], 2),
                "model_weights": json.dumps(used_weights),
            })

    output_df = pd.DataFrame(all_results)
    output_df = output_df.sort_values(["channel", "date"]).reset_index(drop=True)
    output_df.to_csv(output_path, index=False)

    elapsed = time.time() - start_time

    print(f"  Predictions saved: {output_path}")
    print(f"  Shape: {output_df.shape}")
    print(f"  Channels: {channel_names}")
    print(f"  Horizon: {forecast_days} days")
    print(f"  Model version: {model_version}")
    print(f"  Processing time: {elapsed:.2f}s")

    for ch in channel_names:
        ch_data = output_df[output_df["channel"] == ch]
        if len(ch_data) > 0:
            medians = ch_data["forecast_median"].values
            print(f"  {ch}: median range [{medians.min():.0f} - {medians.max():.0f}]")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate predictions from features + model")
    parser.add_argument("--features", default="features.parquet", help="Features parquet file")
    parser.add_argument("--model", default="./pickle/model.pkl", help="Pickled model path")
    parser.add_argument("--output", default="./output/predictions.csv", help="Output CSV path")
    parser.add_argument("--forecast-days", type=int, default=60, help="Forecast horizon in days")
    args = parser.parse_args()

    predict(args.features, args.model, args.output, args.forecast_days)
