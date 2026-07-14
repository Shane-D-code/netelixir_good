"""
Dynamic seasonality detection using autocorrelation and spectral analysis.
Auto-detects the dominant period from historical data.
"""

import numpy as np
from typing import Dict, Tuple


class SeasonalityDetector:
    def __init__(self):
        self.detected_period: int = 7
        self.confidence: float = 0.0

    def detect(self, values: np.ndarray) -> Tuple[int, float]:
        n = len(values)
        if n < 14:
            return 7, 0.0

        acf = self._compute_acf(values)
        acf_peaks = self._find_acf_peaks(acf)

        spectral_peaks = self._find_spectral_peaks(values, n)

        all_candidates = acf_peaks + spectral_peaks
        if not all_candidates:
            self.detected_period = 7
            self.confidence = 0.0
            return 7, 0.0

        from collections import Counter

        counts = Counter(all_candidates)
        best_period, best_count = counts.most_common(1)[0]

        if best_period < 2:
            best_period = 7
        elif best_period > 30:
            best_period = 7

        self.detected_period = best_period
        self.confidence = min(1.0, best_count / 3.0)
        if best_period <= len(acf):
            self.confidence = min(1.0, max(self.confidence, acf[best_period] if best_period < len(acf) else 0.0))

        return self.detected_period, self.confidence

    def get_seasonality_info(self, values: np.ndarray) -> Dict:
        period, conf = self.detect(values)
        n = len(values)

        if period < 2 or n < period:
            return {"period": 7, "confidence": 0.0, "seasonal_indices": [], "strength": 0.0}

        seasonal_indices = []
        for i in range(period):
            indices = list(range(i, n, period))
            if indices:
                mean_val = np.mean([values[j] for j in indices if j < n])
                seasonal_indices.append(float(mean_val))

        overall_mean = np.mean(values) if np.mean(values) > 0 else 1.0
        seasonal_indices = [v / overall_mean for v in seasonal_indices]
        strength = float(np.std(seasonal_indices) / np.mean(seasonal_indices)) if np.mean(seasonal_indices) > 0 else 0.0

        return {
            "period": period,
            "confidence": round(conf, 3),
            "seasonal_indices": [round(v, 4) for v in seasonal_indices],
            "strength": round(strength, 4),
        }

    @staticmethod
    def _compute_acf(values: np.ndarray, max_lag: int = 30) -> np.ndarray:
        n = len(values)
        max_lag = min(max_lag, n // 2)
        mean = np.mean(values)
        var = np.var(values)
        if var == 0:
            return np.zeros(max_lag + 1)
        acf = np.zeros(max_lag + 1)
        acf[0] = 1.0
        for lag in range(1, max_lag + 1):
            if lag < n:
                c = np.corrcoef(values[:-lag], values[lag:])[0, 1]
                acf[lag] = c if not np.isnan(c) else 0.0
        return acf

    @staticmethod
    def _find_acf_peaks(acf: np.ndarray, threshold: float = 0.15) -> list:
        peaks = []
        for i in range(2, len(acf) - 1):
            if acf[i] > acf[i - 1] and acf[i] > acf[i + 1] and acf[i] > threshold:
                peaks.append(i)
        return peaks

    @staticmethod
    def _find_spectral_peaks(values: np.ndarray, n: int) -> list:
        try:
            fft = np.fft.fft(values)
            power = np.abs(fft[: n // 2]) ** 2
            if len(power) < 3:
                return []
            threshold = np.max(power) * 0.1
            peaks = []
            for i in range(1, len(power) - 1):
                if power[i] > power[i - 1] and power[i] > power[i + 1] and power[i] > threshold:
                    period = len(power) / i if i > 0 else 0
                    if 2 <= period <= 30:
                        peaks.append(int(round(period)))
            return peaks
        except Exception:
            return []
