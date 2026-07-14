"""
Adaptive ensemble weighting via cross-validation.
Models with lower validation error receive higher weights.
"""

import numpy as np
from typing import Dict, List, Any, Callable, Optional
from dataclasses import dataclass


@dataclass
class ModelWeight:
    name: str
    weight: float
    validation_error: float
    rank: int


class AdaptiveEnsemble:
    def __init__(self, backtest_engine: Any):
        self.backtest = backtest_engine
        self.weights: Dict[str, float] = {}
        self.model_errors: Dict[str, float] = {}

    def compute_weights(
        self,
        data: np.ndarray,
        models: Dict[str, Callable],
        h: int = 7,
    ) -> Dict[str, float]:
        errors: Dict[str, float] = {}

        for name, model_fn in models.items():
            try:
                result = self.backtest.evaluate(data, model_fn, h=h)
                errors[name] = result.mape if result.mape > 0 else 20.0
            except Exception:
                errors[name] = 100.0

        self.model_errors = errors

        inv_errors = {name: 1.0 / max(err, 0.01) for name, err in errors.items()}
        total = sum(inv_errors.values())
        if total > 0:
            self.weights = {name: val / total for name, val in inv_errors.items()}
        else:
            n = len(errors)
            self.weights = {name: 1.0 / n for name in errors} if n > 0 else {}

        return self.weights

    def get_weighted_forecast(
        self,
        data: np.ndarray,
        h: int,
        models: Dict[str, Callable],
    ) -> Dict[str, Any]:
        if not self.weights:
            self.compute_weights(data, models, h=h)

        ensemble = np.zeros(h)
        model_forecasts: Dict[str, np.ndarray] = {}
        active_models = 0

        for name, model_fn in models.items():
            try:
                result = model_fn(data, h=h)
                if isinstance(result, dict):
                    forecast = result.get("median", result.get("forecast", result.get("mean")))
                else:
                    forecast = result
                forecast_arr = np.array(forecast)[:h]
                w = self.weights.get(name, 0)
                ensemble += forecast_arr * w
                model_forecasts[name] = forecast_arr.tolist()
                active_models += 1
            except Exception:
                continue

        if active_models == 0:
            return {
                "median": np.zeros(h).tolist(),
                "weights": {},
                "model_forecasts": {},
                "model_errors": self.model_errors,
            }

        return {
            "median": ensemble.tolist(),
            "weights": self.weights,
            "model_forecasts": model_forecasts,
            "model_errors": self.model_errors,
        }

    def get_rankings(self) -> List[ModelWeight]:
        if not self.model_errors:
            return []
        sorted_models = sorted(self.model_errors.items(), key=lambda x: x[1])
        return [
            ModelWeight(
                name=name,
                weight=self.weights.get(name, 0),
                validation_error=error,
                rank=i + 1,
            )
            for i, (name, error) in enumerate(sorted_models)
        ]

    def get_summary(self) -> Dict[str, Any]:
        rankings = self.get_rankings()
        if not rankings:
            return {"best_model": None, "n_models": 0, "weights": {}, "rankings": []}
        return {
            "best_model": rankings[0].name,
            "best_model_error": round(rankings[0].validation_error, 2),
            "n_models": len(rankings),
            "weights": {r.name: round(r.weight, 4) for r in rankings},
            "rankings": [
                {
                    "rank": r.rank,
                    "model": r.name,
                    "weight": round(r.weight, 4),
                    "validation_error": round(r.validation_error, 2),
                }
                for r in rankings
            ],
        }
