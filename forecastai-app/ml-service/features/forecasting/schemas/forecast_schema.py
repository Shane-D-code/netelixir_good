"""
Pydantic validation schemas for forecast requests.
"""

from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field, field_validator, ConfigDict


VALID_CHANNELS = ["Google Ads", "Meta Ads", "Microsoft Ads"]

CHANNEL_ALIASES = {
    "google": "Google Ads",
    "meta": "Meta Ads",
    "facebook": "Meta Ads",
    "microsoft": "Microsoft Ads",
    "bing": "Microsoft Ads",
}


class DataPoint(BaseModel):
    model_config = ConfigDict(extra="ignore")

    date: str = Field(..., description="Date in YYYY-MM-DD format")
    revenue: float = Field(..., ge=0, description="Revenue amount (non-negative)")
    channel: str = Field(..., description="Channel name")

    @field_validator("date")
    @classmethod
    def validate_date(cls, v: str) -> str:
        try:
            dt = datetime.strptime(v, "%Y-%m-%d")
        except ValueError:
            raise ValueError(f"Invalid date format '{v}'. Expected YYYY-MM-DD")
        if dt.year < 2018 or dt.year > 2035:
            raise ValueError(f"Date year {dt.year} is outside acceptable range (2018-2035)")
        return v

    @field_validator("channel")
    @classmethod
    def validate_channel(cls, v: str) -> str:
        v_lower = v.lower().strip()
        for channel in VALID_CHANNELS:
            if v_lower == channel.lower():
                return channel
        for alias, canonical in CHANNEL_ALIASES.items():
            if alias in v_lower:
                return canonical
        raise ValueError(f"Invalid channel '{v}'. Must be one of: {', '.join(VALID_CHANNELS)}")


class ForecastRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")

    data: List[DataPoint] = Field(..., min_length=7, description="Historical data points")
    forecast_days: int = Field(60, ge=7, le=365, description="Days to forecast")
    n_simulations: int = Field(1000, ge=100, le=10000, description="Monte Carlo simulations")
    confidence_level: float = Field(0.8, ge=0.5, le=0.99, description="Confidence level")
    backtest_folds: int = Field(3, ge=1, le=10, description="Backtest folds")

    @field_validator("data")
    @classmethod
    def validate_data_quality(cls, v: List[DataPoint]) -> List[DataPoint]:
        if len(v) < 14:
            raise ValueError("At least 14 data points required for reliable forecasting")
        channels = set(d.channel for d in v)
        if len(channels) > 3:
            raise ValueError(f"Too many unique channels ({len(channels)}). Maximum is 3.")
        return v

    def get_time_series(self, channel: Optional[str] = None):
        points = [d for d in self.data if d.channel == channel] if channel else self.data
        combined = sorted([(p.date, p.revenue) for p in points], key=lambda x: x[0])
        return {
            "dates": [c[0] for c in combined],
            "revenues": [c[1] for c in combined],
        }

    def to_raw_dicts(self) -> List[dict]:
        return [{"date": d.date, "revenue": d.revenue, "channel": d.channel} for d in self.data]
