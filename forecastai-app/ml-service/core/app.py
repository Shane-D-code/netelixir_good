"""
ML Forecasting Microservice v3.1
FastAPI with statsforecast ensemble, backtesting, adaptive weights, caching
"""

from __future__ import annotations

import json
import time
from typing import Any, Dict, List, Optional

import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware

from core.logging import logger
from features.forecasting.services.backtesting import BacktestEngine
from features.forecasting.services.seasonality_detector import SeasonalityDetector

# ─── Optional ML Dependencies ─────────────────────────────────────────

try:
    from statsforecast import StatsForecast
    from statsforecast.models import (
        AutoARIMA,
        AutoETS,
        AutoTheta,
        HistoricAverage,
        SeasonalNaive,
    )
    STATSFORECAST_AVAILABLE = True
except ImportError:
    STATSFORECAST_AVAILABLE = False

try:
    from sklearn.ensemble import IsolationForest
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False

# ─── Lazy cache import ────────────────────────────────────────────────

_model_cache: Optional[Any] = None


def _get_cache():
    global _model_cache
    if _model_cache is None:
        from features.forecasting.services.model_cache import ModelCache
        _model_cache = ModelCache(ttl_hours=24)
    return _model_cache


# ─── App Setup ────────────────────────────────────────────────────────

app = FastAPI(title="ML Forecasting Service", version="3.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type"],
)

backtest_engine = BacktestEngine(n_folds=3, test_size=7)
seasonality_detector = SeasonalityDetector()

MODEL_VERSION = "3.1.0"


# ─── Helpers ──────────────────────────────────────────────────────────

def _detect_season_length(values: np.ndarray) -> int:
    period, conf = seasonality_detector.detect(values)
    if conf > 0.3 and 2 <= period <= 30:
        return period
    return 7


def _detect_contamination(values: np.ndarray) -> float:
    if len(values) < 20:
        return 0.1
    q1 = np.percentile(values, 25)
    q3 = np.percentile(values, 75)
    iqr = q3 - q1
    if iqr == 0:
        return 0.1
    lower = q1 - 2.0 * iqr
    upper = q3 + 2.0 * iqr
    outliers = np.sum((values < lower) | (values > upper))
    contamination = np.clip(outliers / len(values), 0.02, 0.25)
    return float(contamination)


# ─── Holt-Winters Fallback ───────────────────────────────────────────

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
    second_avg = np.mean(values[period : period * 2])
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


# ─── Model functions (compatible with backtesting engine) ─────────────

def _statsforecast_model_fn(
    values: np.ndarray,
    h: int = 7,
    season_length: int = 7,
    **_kwargs: Any,
) -> Dict[str, Any]:
    if not STATSFORECAST_AVAILABLE or len(values) < max(14, season_length * 2):
        raise RuntimeError("statsforecast unavailable or insufficient data")

    ds = pd.date_range(start="2024-01-01", periods=len(values), freq="D")
    sf_df = pd.DataFrame({"ds": ds, "y": values, "unique_id": "series"})

    models = [
        AutoARIMA(season_length=season_length),
        AutoETS(season_length=season_length),
        AutoTheta(season_length=season_length),
        SeasonalNaive(season_length=season_length),
        HistoricAverage(),
    ]

    sf = StatsForecast(models=models, freq="D", n_jobs=1)
    sf.fit(sf_df)
    forecast_df = sf.predict(h=h)

    model_cols = [c for c in forecast_df.columns if c not in ("ds", "unique_id")]
    if not model_cols:
        raise RuntimeError("No model columns in forecast")

    forecasts = {col: forecast_df[col].values for col in model_cols}
    mean_forecast = np.mean([forecasts[col] for col in model_cols], axis=0)

    return {"median": mean_forecast, **forecasts}


def _holt_winters_model_fn(
    values: np.ndarray,
    h: int = 7,
    season_length: int = 7,
    **_kwargs: Any,
) -> Dict[str, Any]:
    forecast = holt_winters_fallback(values, h, period=season_length)
    return {"median": forecast}


# ─── Forecast Endpoint ────────────────────────────────────────────────

@app.post("/forecast")
async def forecast(request: Dict[str, Any]):
    start_time = time.time()

    data = request.get("data", [])
    days = request.get("forecast_days", 60)
    n_simulations = request.get("n_simulations", 1000)

    if not data or not isinstance(data, list):
        raise HTTPException(status_code=400, detail="No data provided")

    try:
        validated_points = []
        for i, pt in enumerate(data):
            if not isinstance(pt, dict):
                continue
            date_val = str(pt.get("date", ""))
            revenue_val = float(pt.get("revenue", 0))
            channel_val = str(pt.get("channel", ""))
            if date_val and revenue_val >= 0 and channel_val:
                validated_points.append({"date": date_val, "revenue": revenue_val, "channel": channel_val})
        if len(validated_points) < 7:
            raise HTTPException(status_code=400, detail="Need at least 7 valid data points")
        data = validated_points
    except (ValueError, TypeError) as e:
        raise HTTPException(status_code=400, detail=f"Invalid data: {e}")

    logger.info(
        f"Forecast request: {len(data)} points, {days} days, {n_simulations} simulations"
    )

    # Check cache
    cache = _get_cache()
    cached = cache.get(data, {"forecast_days": days, "n_simulations": n_simulations})
    if cached is not None:
        logger.info("Cache hit for forecast request")
        return cached

    # Build time series
    df = pd.DataFrame(data)
    df = df.rename(columns={"date": "ds", "revenue": "y"})
    df["ds"] = pd.to_datetime(df["ds"])
    df = df.sort_values("ds").reset_index(drop=True)
    values = df["y"].values.astype(float)

    # Detect seasonality from data
    season_length = _detect_season_length(values)

    logger.info(f"Detected season_length={season_length}, data_len={len(values)}")

    point_forecast = None
    model_weights: Dict[str, float] = {}

    # Try statsforecast ensemble
    if STATSFORECAST_AVAILABLE and len(values) >= 14:
        try:
            sf_ds = pd.date_range(start="2024-01-01", periods=len(values), freq="D")
            sf_df = pd.DataFrame({"ds": sf_ds, "y": values, "unique_id": "series"})

            models = [
                AutoARIMA(season_length=season_length),
                AutoETS(season_length=season_length),
                AutoTheta(season_length=season_length),
                SeasonalNaive(season_length=season_length),
                HistoricAverage(),
            ]

            sf = StatsForecast(models=models, freq="D", n_jobs=1)
            sf.fit(sf_df)
            forecast_df = sf.predict(h=days)

            model_cols = [c for c in forecast_df.columns if c not in ("ds", "unique_id")]
            if model_cols:
                # Adaptive weighting via backtesting
                sf_model_fns = {}
                for col in model_cols:
                    def _make_fn(c=col):
                        def _fn(v, h=days, sl=season_length, **kw):
                            ds = pd.date_range(start="2024-01-01", periods=len(v), freq="D")
                            sfd = pd.DataFrame({"ds": ds, "y": v, "unique_id": "series"})
                            model_map = {
                                "AutoARIMA": AutoARIMA(season_length=sl),
                                "AutoETS": AutoETS(season_length=sl),
                                "AutoTheta": AutoTheta(season_length=sl),
                                "SeasonalNaive": SeasonalNaive(season_length=sl),
                                "HistoricAverage": HistoricAverage(),
                            }
                            m = model_map.get(c, AutoARIMA(season_length=sl))
                            s = StatsForecast(models=[m], freq="D", n_jobs=1)
                            s.fit(sfd)
                            f = s.predict(h=h)
                            fc = [cc for cc in f.columns if cc not in ("ds", "unique_id")]
                            return {"median": f[fc[0]].values if fc else np.zeros(h)}
                        return _fn
                    sf_model_fns[col] = _make_fn()

                # Compute adaptive weights
                from features.forecasting.services.adaptive_ensemble import AdaptiveEnsemble
                ensemble = AdaptiveEnsemble(backtest_engine)
                adaptive_weights = ensemble.compute_weights(values, sf_model_fns, h=min(7, days))

                # Use adaptive weights for ensemble
                point_forecast = np.zeros(days)
                model_weights = {}
                for col in model_cols:
                    w = adaptive_weights.get(col, 1.0 / len(model_cols))
                    fc = forecast_df[col].values
                    point_forecast += fc[:days] * w
                    model_weights[col] = round(w, 4)

            else:
                point_forecast = forecast_df.iloc[:, -1].values[:days]
                model_weights = {"auto": 1.0}

            logger.info(f"StatsForecast ensemble complete, weights: {model_weights}")

        except Exception as e:
            logger.warning(f"StatsForecast failed: {e}")
            point_forecast = None

    # Fallback to Holt-Winters
    if point_forecast is None:
        point_forecast = holt_winters_fallback(values, days, period=season_length)
        model_weights = {"Holt-Winters (fallback)": 1.0}

    point_forecast = np.maximum(point_forecast, 0)

    # Backtesting evaluation
    backtest_result = None
    try:
        model_fn = _statsforecast_model_fn if STATSFORECAST_AVAILABLE and len(values) >= 14 else _holt_winters_model_fn
        backtest_result = backtest_engine.evaluate(
            values, model_fn, season_length=season_length
        )
        logger.info(f"Backtest: MAPE={backtest_result.mape:.1f}%, RMSE={backtest_result.rmse:.1f}")
    except Exception as e:
        logger.warning(f"Backtest failed: {e}")

    # Monte Carlo simulation (AR(1) correlated noise)
    residuals = np.diff(values) / (np.abs(values[:-1]) + 1) if len(values) > 1 else np.array([0.1])
    error_std = max(float(np.std(residuals)), 0.01)
    phi = 0.7

    simulations = np.zeros((n_simulations, days))
    for s in range(n_simulations):
        prev_noise = 0.0
        for i in range(days):
            noise = phi * prev_noise + np.random.normal(0, error_std * 0.5)
            simulations[s, i] = max(0, point_forecast[i] * (1 + noise))
            prev_noise = noise

    median = np.median(simulations, axis=0).tolist()
    p5 = np.percentile(simulations, 5, axis=0).tolist()
    p10 = np.percentile(simulations, 10, axis=0).tolist()
    p25 = np.percentile(simulations, 25, axis=0).tolist()
    p75 = np.percentile(simulations, 75, axis=0).tolist()
    p90 = np.percentile(simulations, 90, axis=0).tolist()
    p95 = np.percentile(simulations, 95, axis=0).tolist()
    mean = np.mean(simulations, axis=0).tolist()

    # Seasonality info
    seasonality_info = seasonality_detector.get_seasonality_info(values)

    processing_time = time.time() - start_time

    response: Dict[str, Any] = {
        "success": True,
        "forecast": {
            "median": median,
            "p5": p5,
            "p10": p10,
            "p25": p25,
            "p75": p75,
            "p90": p90,
            "p95": p95,
            "mean": mean,
            "model_weights": model_weights,
        },
        "model_weights": model_weights,
        "backtest": backtest_result.to_dict() if backtest_result else None,
        "seasonality": seasonality_info,
        "processing_time": round(processing_time, 3),
        "model_version": MODEL_VERSION,
    }

    # Cache result
    cache.set(data, {"forecast_days": days, "n_simulations": n_simulations}, response)

    logger.info(f"Forecast complete in {processing_time:.2f}s")
    return response


# ─── Anomaly Detection ────────────────────────────────────────────────

@app.post("/anomalies")
async def detect_anomalies(request: Dict[str, Any]):
    data = request.get("data", [])
    if not data:
        raise HTTPException(status_code=400, detail="No data provided")

    df = pd.DataFrame(data)
    if "revenue" not in df.columns:
        raise HTTPException(status_code=400, detail="Data must contain 'revenue' column")

    if SKLEARN_AVAILABLE and len(df) >= 10:
        try:
            date_col = "date" if "date" in df.columns else "ds"
            grouped = df.groupby(date_col)["revenue"].sum().reset_index()
            grouped["ma7"] = grouped["revenue"].rolling(7, min_periods=1).mean()
            grouped["std7"] = grouped["revenue"].rolling(7, min_periods=1).std().fillna(1)
            grouped["zscore"] = (grouped["revenue"] - grouped["ma7"]) / (grouped["std7"] + 1)

            # Dynamic contamination instead of hardcoded 0.1
            contamination = _detect_contamination(grouped["revenue"].values)

            iso = IsolationForest(contamination=contamination, random_state=42)
            features = grouped[["revenue", "zscore"]].fillna(0)
            preds = iso.fit_predict(features)

            anomalies = []
            for i, pred in enumerate(preds):
                if pred == -1:
                    anomalies.append({
                        "date": str(grouped.iloc[i][date_col]),
                        "revenue": float(grouped.iloc[i]["revenue"]),
                        "zscore": float(grouped.iloc[i]["zscore"]),
                        "severity": "high" if abs(grouped.iloc[i]["zscore"]) > 3 else "medium",
                    })
            return {"success": True, "anomalies": anomalies, "contamination": contamination}
        except Exception as e:
            logger.warning(f"IsolationForest failed: {e}")

    # Z-score fallback
    anomalies = []
    if "revenue" in df.columns and len(df) >= 7:
        date_col = "date" if "date" in df.columns else "ds"
        grouped = df.groupby(date_col)["revenue"].sum().reset_index()
        grouped["ma7"] = grouped["revenue"].rolling(7, min_periods=1).mean()
        grouped["std7"] = grouped["revenue"].rolling(7, min_periods=1).std().fillna(1)
        grouped["zscore"] = (grouped["revenue"] - grouped["ma7"]) / (grouped["std7"] + 1)
        for _, row in grouped.iterrows():
            if abs(row["zscore"]) > 2.5:
                anomalies.append({
                    "date": str(row[date_col]),
                    "revenue": float(row["revenue"]),
                    "zscore": float(row["zscore"]),
                    "severity": "high" if abs(row["zscore"]) > 3.5 else "medium",
                })
    return {"success": True, "anomalies": anomalies}


# ─── Health Check ─────────────────────────────────────────────────────

@app.get("/health")
async def health():
    cache = _get_cache()
    cache_stats = cache.get_stats()
    return {
        "status": "healthy",
        "service": "ml-microservice",
        "version": MODEL_VERSION,
        "statsforecast": STATSFORECAST_AVAILABLE,
        "sklearn": SKLEARN_AVAILABLE,
        "cache": cache_stats,
    }


# ─── Entry Point ──────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
