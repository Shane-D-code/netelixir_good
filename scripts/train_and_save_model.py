#!/usr/bin/env python
"""
Train and save the ForecastAI model as a pickle bundle.
Replicates the production ML pipeline from forecastai-app/ml-service.
"""

import pickle
import time
from pathlib import Path

import numpy as np
import pandas as pd

try:
    from statsforecast import StatsForecast
    from statsforecast.models import (
        AutoARIMA,
        AutoETS,
        AutoTheta,
        HistoricAverage,
        SeasonalNaive,
    )
    HAS_STATSFORECAST = True
except ImportError:
    HAS_STATSFORECAST = False

CHANNEL_ALIASES = {
    "google": "Google Ads",
    "googleads": "Google Ads",
    "google ads": "Google Ads",
    "meta": "Meta Ads",
    "metaads": "Meta Ads",
    "meta ads": "Meta Ads",
    "facebook": "Meta Ads",
    "microsoft": "Microsoft Ads",
    "microsoftads": "Microsoft Ads",
    "microsoft ads": "Microsoft Ads",
    "bing": "Microsoft Ads",
}


def normalize_channel(ch: str) -> str:
    ch_lower = ch.strip().lower()
    return CHANNEL_ALIASES.get(ch_lower, ch.strip())


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


def mape(actual: np.ndarray, forecast: np.ndarray) -> float:
    mask = actual > 0
    if np.sum(mask) == 0:
        return 100.0
    return float(np.mean(np.abs((actual[mask] - forecast[mask]) / actual[mask])) * 100)


def compute_adaptive_weights(values: np.ndarray, h: int, season_length: int) -> dict:
    if not HAS_STATSFORECAST or len(values) < 28:
        models = ["AutoARIMA", "AutoETS", "AutoTheta", "SeasonalNaive", "HistoricAverage"]
        n = len(models)
        return {m: round(1.0 / n, 4) for m in models}

    ds = pd.date_range(start="2024-01-01", periods=len(values), freq="D")

    model_classes = {
        "AutoARIMA": lambda sl: AutoARIMA(season_length=sl),
        "AutoETS": lambda sl: AutoETS(season_length=sl),
        "AutoTheta": lambda sl: AutoTheta(season_length=sl),
        "SeasonalNaive": lambda sl: SeasonalNaive(season_length=sl),
        "HistoricAverage": lambda sl: HistoricAverage(),
    }

    errors = {}
    for name, make_model in model_classes.items():
        fold_errors = []
        n = len(values)
        n_folds = 3
        test_size = min(7, h)

        for fold in range(n_folds):
            train_end = n - (n_folds - fold) * test_size
            if train_end < 14:
                continue
            train = values[:train_end]
            test = values[train_end:train_end + test_size]

            try:
                sf_df = pd.DataFrame({
                    "ds": pd.date_range(start="2024-01-01", periods=len(train), freq="D"),
                    "y": train,
                    "unique_id": "series",
                })
                sf = StatsForecast(models=[make_model(season_length=season_length)], freq="D", n_jobs=1)
                sf.fit(sf_df)
                f = sf.predict(h=len(test))
                model_cols = [c for c in f.columns if c not in ("ds", "unique_id")]
                if model_cols:
                    pred = f[model_cols[0]].values
                    fold_errors.append(mape(test, pred))
            except Exception:
                continue

        errors[name] = np.mean(fold_errors) if fold_errors else 100.0

    inv_errors = {name: 1.0 / max(err, 0.01) for name, err in errors.items()}
    total = sum(inv_errors.values())
    weights = {name: round(val / total, 4) for name, val in inv_errors.items()} if total > 0 else {}

    return weights


def train_model(data_dir: str = "./data", output_path: str = "./pickle/model.pkl"):
    start = time.time()
    print("Training ForecastAI model...")
    print(f"  Data dir: {data_dir}")

    import glob
    csv_files = sorted(glob.glob(f"{data_dir}/*.csv"))
    if not csv_files:
        raise FileNotFoundError(f"No CSV files in {data_dir}")

    dfs = []
    for f in csv_files:
        df = pd.read_csv(f)
        df.columns = [c.strip().lower() for c in df.columns]
        df["date"] = pd.to_datetime(df["date"]).dt.strftime("%Y-%m-%d")
        df["channel"] = df["channel"].apply(normalize_channel)
        df["revenue"] = pd.to_numeric(df["revenue"], errors="coerce").fillna(0)
        dfs.append(df[["date", "channel", "revenue"]])

    combined = pd.concat(dfs, ignore_index=True)
    combined = combined.sort_values(["channel", "date"]).reset_index(drop=True)

    print(f"  Total rows: {len(combined)}")
    print(f"  Channels: {combined['channel'].unique().tolist()}")

    sf_fitted = {}
    model_weights = {}

    for ch_name, ch_data in combined.groupby("channel"):
        ch_data = ch_data.sort_values("date").reset_index(drop=True)
        values = ch_data["revenue"].values.astype(float)

        if len(values) < 14:
            print(f"  Skipping {ch_name}: only {len(values)} points")
            continue

        season_length = detect_seasonality(values)
        print(f"  {ch_name}: {len(values)} points, season={season_length}")

        weights = compute_adaptive_weights(values, h=7, season_length=season_length)
        model_weights[ch_name] = weights

        if HAS_STATSFORECAST:
            sf_df = pd.DataFrame({
                "ds": pd.date_range(start="2024-01-01", periods=len(values), freq="D"),
                "y": values,
                "unique_id": "series",
            })

            models = [
                AutoARIMA(season_length=season_length),
                AutoETS(season_length=season_length),
                AutoTheta(season_length=season_length),
                SeasonalNaive(season_length=season_length),
                HistoricAverage(),
            ]

            sf = StatsForecast(models=models, freq="D", n_jobs=1)
            sf.fit(sf_df)
            sf_fitted[ch_name] = sf
            print(f"    Fitted 5 models with adaptive weights: {weights}")

    Path(output_path).parent.mkdir(parents=True, exist_ok=True)

    bundle = {
        "version": "3.1.0",
        "statsforecast_fitted": sf_fitted,
        "model_weights": model_weights,
        "channels": combined["channel"].unique().tolist(),
    }

    with open(output_path, "wb") as f:
        pickle.dump(bundle, f)

    elapsed = time.time() - start
    file_size = Path(output_path).stat().st_size / (1024 * 1024)

    print(f"\n  Model saved: {output_path}")
    print(f"  File size: {file_size:.1f} MB")
    print(f"  Training time: {elapsed:.2f}s")
    print(f"  Channels with models: {list(sf_fitted.keys())}")

    return bundle


if __name__ == "__main__":
    train_model()
