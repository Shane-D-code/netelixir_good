#!/usr/bin/env python
"""
Feature Generation for ForecastAI.
Reads CSV files from data/ and generates engineered features.
"""

import argparse
import glob
import json

import numpy as np
import pandas as pd


HOLIDAYS = {
    "2024-01-01", "2024-01-15", "2024-02-19", "2024-05-27",
    "2024-06-19", "2024-07-04", "2024-09-02", "2024-10-14",
    "2024-11-11", "2024-11-28", "2024-11-29", "2024-12-25",
    "2025-01-01", "2025-01-20", "2025-02-17", "2025-05-26",
    "2025-06-19", "2025-07-04", "2025-09-01", "2025-10-13",
    "2025-11-11", "2025-11-27", "2025-11-28", "2025-12-25",
    "2026-01-01", "2026-01-19", "2026-02-16", "2026-05-25",
    "2026-06-19", "2026-07-04", "2026-09-07", "2026-10-12",
    "2026-11-11", "2026-11-26", "2026-11-27", "2026-12-25",
}

BLACK_FRIDAYS = {"2024-11-29", "2025-11-28", "2026-11-27"}

VALID_CHANNELS = ["Google Ads", "Meta Ads", "Microsoft Ads"]

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


def encode_cyclical(value: float, max_val: float) -> tuple:
    return (np.sin(2 * np.pi * value / max_val),
            np.cos(2 * np.pi * value / max_val))


def engineering_features(df: pd.DataFrame) -> pd.DataFrame:
    dates = pd.to_datetime(df["date"])
    n = len(df)

    dow = dates.dt.dayofweek.values
    month = (dates.dt.month - 1).values
    dom = (dates.dt.day - 1).values
    quarter = dates.dt.quarter.values

    dow_sin = np.zeros(n)
    dow_cos = np.zeros(n)
    month_sin = np.zeros(n)
    month_cos = np.zeros(n)
    dom_sin = np.zeros(n)
    dom_cos = np.zeros(n)

    for i in range(n):
        dow_sin[i], dow_cos[i] = encode_cyclical(dow[i], 7)
        month_sin[i], month_cos[i] = encode_cyclical(month[i], 12)
        dom_sin[i], dom_cos[i] = encode_cyclical(dom[i], 31)

    date_strs = dates.dt.strftime("%Y-%m-%d").values

    features = pd.DataFrame({
        "date": df["date"].values,
        "channel": df["channel"].values,
        "revenue": df["revenue"].values.astype(float),
        "dow_sin": dow_sin,
        "dow_cos": dow_cos,
        "month_sin": month_sin,
        "month_cos": month_cos,
        "dom_sin": dom_sin,
        "dom_cos": dom_cos,
        "quarter": quarter,
        "is_weekend": np.where((dow == 0) | (dow == 6), 1, 0),
        "is_holiday": np.array([1 if ds in HOLIDAYS else 0 for ds in date_strs]),
        "is_black_friday": np.array([1 if ds in BLACK_FRIDAYS else 0 for ds in date_strs]),
    })

    return features


def add_lag_features(features: pd.DataFrame) -> pd.DataFrame:
    for lag in [1, 3, 7]:
        features[f"lag_{lag}"] = features["revenue"].shift(lag).bfill()

    for w in [7, 14]:
        features[f"rolling_mean_{w}"] = (
            features["revenue"].rolling(w, min_periods=1).mean()
        )

    return features


def generate_features(data_dir: str, output_path: str):
    csv_files = sorted(glob.glob(f"{data_dir}/*.csv"))
    if not csv_files:
        raise FileNotFoundError(f"No CSV files found in {data_dir}")

    dfs = []
    for f in csv_files:
        df = pd.read_csv(f)
        df.columns = [c.strip().lower() for c in df.columns]

        if "date" not in df.columns or "revenue" not in df.columns or "channel" not in df.columns:
            raise ValueError(f"CSV must have date, channel, revenue columns. Got: {list(df.columns)}")

        df["date"] = pd.to_datetime(df["date"]).dt.strftime("%Y-%m-%d")
        df["channel"] = df["channel"].apply(normalize_channel)
        df["revenue"] = pd.to_numeric(df["revenue"], errors="coerce").fillna(0)
        dfs.append(df[["date", "channel", "revenue"]])

    combined = pd.concat(dfs, ignore_index=True)
    combined = combined.sort_values(["channel", "date"]).reset_index(drop=True)

    features = engineering_features(combined)
    features = add_lag_features(features)

    channel_dummies = pd.get_dummies(features["channel"], prefix="channel")
    features = pd.concat([features, channel_dummies], axis=1)

    features.to_parquet(output_path, index=False)

    print(f"  Features saved: {output_path}")
    print(f"  Shape: {features.shape}")
    print(f"  Channels: {combined['channel'].unique().tolist()}")
    print(f"  Date range: {combined['date'].min()} to {combined['date'].max()}")
    print(f"  Rows per channel:")
    for ch, grp in combined.groupby("channel"):
        print(f"    {ch}: {len(grp)} days")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate features from CSV data")
    parser.add_argument("--data-dir", default="./data", help="Directory with input CSVs")
    parser.add_argument("--output", default="features.parquet", help="Output parquet path")
    args = parser.parse_args()

    generate_features(args.data_dir, args.output)
