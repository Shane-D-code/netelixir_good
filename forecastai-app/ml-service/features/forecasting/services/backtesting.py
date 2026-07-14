"""
Walk-forward backtesting engine with multiple evaluation metrics.
Computes MAPE, RMSE, sMAPE, MASE, coverage, bias, and directional accuracy.
"""

import numpy as np
from typing import Dict, List, Optional, Callable, Any
from dataclasses import dataclass, field


@dataclass
class BacktestResult:
    mape: float = 0.0
    rmse: float = 0.0
    smape: float = 0.0
    mase: float = 0.0
    coverage_90: float = 0.0
    coverage_80: float = 0.0
    bias: float = 0.0
    mda: float = 0.0
    n_folds: int = 0
    fold_metrics: List[Dict] = field(default_factory=list)
    forecast_errors: List[float] = field(default_factory=list)

    def to_dict(self) -> Dict:
        return {
            "mape": round(self.mape, 2),
            "rmse": round(self.rmse, 2),
            "smape": round(self.smape, 2),
            "mase": round(self.mase, 4),
            "coverage_90": round(self.coverage_90, 1),
            "coverage_80": round(self.coverage_80, 1),
            "bias": round(self.bias, 4),
            "mda": round(self.mda, 1),
            "n_folds": self.n_folds,
            "fold_metrics": self.fold_metrics,
        }


class BacktestEngine:
    def __init__(self, n_folds: int = 5, test_size: int = 7):
        self.n_folds = n_folds
        self.test_size = test_size

    def evaluate(
        self,
        values: np.ndarray,
        model_fn: Callable[..., Any],
        **model_kwargs: Any,
    ) -> BacktestResult:
        n = len(values)
        if n < self.test_size * (self.n_folds + 1) or n < 14:
            return self._fallback(values)

        fold_results: List[Dict] = []
        all_predictions: List[float] = []
        all_actuals: List[float] = []

        for fold in range(self.n_folds):
            train_end = n - (self.n_folds - fold) * self.test_size
            if train_end < 14:
                continue
            train = values[:train_end]
            test = values[train_end : train_end + self.test_size]
            if len(test) < 1:
                continue

            try:
                result = model_fn(train, h=len(test), **model_kwargs)
                pred = self._extract_forecast(result)
                if pred is None:
                    continue

                min_len = min(len(pred), len(test))
                pred = np.array(pred[:min_len])
                actual = np.array(test[:min_len])

                all_predictions.extend(pred.tolist())
                all_actuals.extend(actual.tolist())

                fold_results.append(
                    {
                        "fold": fold + 1,
                        "mape": round(self._mape(actual, pred), 2),
                        "rmse": round(self._rmse(actual, pred), 2),
                        "train_size": len(train),
                        "test_size": min_len,
                    }
                )
            except Exception:
                continue

        if not all_predictions:
            return self._fallback(values)

        actuals_arr = np.array(all_actuals)
        preds_arr = np.array(all_predictions)
        forecast_errors = (preds_arr - actuals_arr).tolist()

        return BacktestResult(
            mape=self._mape(actuals_arr, preds_arr),
            rmse=self._rmse(actuals_arr, preds_arr),
            smape=self._smape(actuals_arr, preds_arr),
            mase=self._mase(actuals_arr, preds_arr, values),
            coverage_90=self._coverage(actuals_arr, preds_arr, 1.645),
            coverage_80=self._coverage(actuals_arr, preds_arr, 1.282),
            bias=float(np.mean(preds_arr - actuals_arr) / (np.mean(actuals_arr) + 1e-8)),
            mda=self._mda(actuals_arr, preds_arr),
            n_folds=len(fold_results),
            fold_metrics=fold_results,
            forecast_errors=forecast_errors,
        )

    def _extract_forecast(self, result: Any) -> Optional[np.ndarray]:
        if isinstance(result, dict):
            for key in ("median", "forecast", "mean"):
                if key in result:
                    val = result[key]
                    return np.array(val) if not isinstance(val, np.ndarray) else val
            return None
        if isinstance(result, np.ndarray):
            return result
        if isinstance(result, (list, tuple)):
            return np.array(result)
        return None

    def _fallback(self, values: np.ndarray) -> BacktestResult:
        if len(values) < 2:
            return BacktestResult()
        naive = np.roll(values, 1)[1:]
        actual = values[1:]
        return BacktestResult(
            mape=self._mape(actual, naive),
            rmse=self._rmse(actual, naive),
            smape=self._smape(actual, naive),
            mase=1.0,
            coverage_90=50.0,
            coverage_80=40.0,
            bias=0.0,
            mda=50.0,
            n_folds=0,
            fold_metrics=[],
        )

    @staticmethod
    def _mape(actual: np.ndarray, forecast: np.ndarray) -> float:
        mask = actual > 0
        if np.sum(mask) == 0:
            return 0.0
        return float(np.mean(np.abs((actual[mask] - forecast[mask]) / actual[mask])) * 100)

    @staticmethod
    def _rmse(actual: np.ndarray, forecast: np.ndarray) -> float:
        return float(np.sqrt(np.mean((actual - forecast) ** 2)))

    @staticmethod
    def _smape(actual: np.ndarray, forecast: np.ndarray) -> float:
        denom = np.abs(actual) + np.abs(forecast)
        mask = denom > 0
        if np.sum(mask) == 0:
            return 0.0
        return float(np.mean(2 * np.abs(actual[mask] - forecast[mask]) / denom[mask]) * 100)

    @staticmethod
    def _mase(actual: np.ndarray, forecast: np.ndarray, train: np.ndarray) -> float:
        if len(train) < 2:
            return 0.0
        naive_err = np.mean(np.abs(np.diff(train)))
        if naive_err == 0:
            return 0.0
        return float(np.mean(np.abs(actual - forecast)) / naive_err)

    @staticmethod
    def _coverage(actual: np.ndarray, forecast: np.ndarray, z: float) -> float:
        std = np.std(actual - forecast)
        lower = forecast - z * std
        upper = forecast + z * std
        in_range = np.sum((actual >= lower) & (actual <= upper))
        return float((in_range / len(actual)) * 100) if len(actual) > 0 else 0.0

    @staticmethod
    def _mda(actual: np.ndarray, forecast: np.ndarray) -> float:
        if len(actual) < 2:
            return 0.0
        actual_dir = np.sign(np.diff(actual))
        forecast_dir = np.sign(np.diff(forecast))
        correct = np.sum(actual_dir == forecast_dir)
        return float((correct / len(actual_dir)) * 100)
