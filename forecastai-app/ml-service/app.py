"""
Real ML Forecasting Microservice
FastAPI + Prophet + scikit-learn + XGBoost
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np
from prophet import Prophet
from statsmodels.tsa.holtwinters import ExponentialSmoothing
from sklearn.ensemble import RandomForestRegressor, IsolationForest
from sklearn.preprocessing import RobustScaler
import xgboost as xgb
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import holidays

app = FastAPI(title="ML Forecasting Service", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

us_holidays = holidays.US()


class RealMLForecaster:
    """Production-grade ML forecasting engine"""

    def __init__(self):
        self.models = {}
        self.weights = {}
        self.scaler = RobustScaler()

    def add_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Add time-based features"""
        df = df.copy()
        df['ds'] = pd.to_datetime(df['ds'])

        df['dayofweek'] = df['ds'].dt.dayofweek
        df['month'] = df['ds'].dt.month
        df['quarter'] = df['ds'].dt.quarter
        df['dayofyear'] = df['ds'].dt.dayofyear
        df['weekofyear'] = df['ds'].dt.isocalendar().week

        df['sin_dow'] = np.sin(2 * np.pi * df['dayofweek'] / 7)
        df['cos_dow'] = np.cos(2 * np.pi * df['dayofweek'] / 7)
        df['sin_month'] = np.sin(2 * np.pi * df['month'] / 12)
        df['cos_month'] = np.cos(2 * np.pi * df['month'] / 12)

        df['is_holiday'] = df['ds'].apply(lambda x: 1 if x in us_holidays else 0)
        df['is_weekend'] = df['ds'].apply(lambda x: 1 if x.weekday() >= 5 else 0)

        for lag in [1, 3, 7, 14, 28]:
            df[f'lag_{lag}'] = df['y'].shift(lag).fillna(df['y'].mean())

        for window in [7, 14, 28]:
            df[f'rolling_mean_{window}'] = df['y'].rolling(window).mean().fillna(df['y'].mean())
            df[f'rolling_std_{window}'] = df['y'].rolling(window).std().fillna(df['y'].std())

        return df

    def train_prophet(self, df: pd.DataFrame) -> Dict:
        try:
            model = Prophet(
                yearly_seasonality=True,
                weekly_seasonality=True,
                daily_seasonality=False,
                seasonality_prior_scale=10,
                changepoint_prior_scale=0.05,
                holidays_prior_scale=10
            )
            model.add_country_holidays(country_name='US')
            model.fit(df[['ds', 'y']])
            return {'model': model, 'status': 'success'}
        except Exception as e:
            return {'status': 'failed', 'error': str(e)}

    def train_ets(self, df: pd.DataFrame) -> Dict:
        try:
            series = df.set_index('ds')['y']
            model = ExponentialSmoothing(
                series,
                trend='add',
                seasonal='add',
                seasonal_periods=7,
                initialization_method='estimated'
            ).fit()
            return {'model': model, 'status': 'success'}
        except Exception as e:
            return {'status': 'failed', 'error': str(e)}

    def train_xgboost(self, df: pd.DataFrame) -> Dict:
        try:
            features_df = self.add_features(df)
            feature_cols = ['sin_dow', 'cos_dow', 'sin_month', 'cos_month',
                           'is_holiday', 'is_weekend', 'lag_7', 'lag_14', 'lag_28',
                           'rolling_mean_7', 'rolling_mean_28']

            X = features_df[feature_cols].values
            y = features_df['y'].values

            X_scaled = self.scaler.fit_transform(X)

            model = xgb.XGBRegressor(
                n_estimators=200,
                max_depth=8,
                learning_rate=0.05,
                subsample=0.8,
                colsample_bytree=0.8,
                random_state=42
            )
            model.fit(X_scaled, y)

            return {
                'model': model,
                'features': feature_cols,
                'status': 'success'
            }
        except Exception as e:
            return {'status': 'failed', 'error': str(e)}

    def train_random_forest(self, df: pd.DataFrame) -> Dict:
        try:
            features_df = self.add_features(df)
            feature_cols = ['sin_dow', 'cos_dow', 'sin_month', 'cos_month',
                           'is_holiday', 'is_weekend', 'lag_7', 'lag_14', 'lag_28',
                           'rolling_mean_7', 'rolling_mean_28']

            X = features_df[feature_cols].values
            y = features_df['y'].values

            X_scaled = self.scaler.fit_transform(X)

            model = RandomForestRegressor(
                n_estimators=100,
                max_depth=12,
                min_samples_split=10,
                min_samples_leaf=5,
                random_state=42,
                n_jobs=-1
            )
            model.fit(X_scaled, y)

            return {
                'model': model,
                'features': feature_cols,
                'status': 'success'
            }
        except Exception as e:
            return {'status': 'failed', 'error': str(e)}

    def predict_with_uncertainty(self, df: pd.DataFrame, days: int, n_simulations: int = 1000) -> Dict:
        models = {
            'prophet': self.train_prophet(df),
            'ets': self.train_ets(df),
            'xgboost': self.train_xgboost(df),
            'random_forest': self.train_random_forest(df)
        }

        predictions = []
        future_dates = [df['ds'].max() + timedelta(days=i) for i in range(1, days + 1)]

        if models['prophet']['status'] == 'success':
            future_df = pd.DataFrame({'ds': future_dates})
            forecast = models['prophet']['model'].predict(future_df)
            predictions.append(forecast['yhat'].values)

        if models['ets']['status'] == 'success':
            forecast = models['ets']['model'].forecast(days)
            predictions.append(forecast.values)

        if models['xgboost']['status'] == 'success':
            pred = self._predict_ml(models['xgboost'], df, future_dates, days)
            predictions.append(pred)

        if models['random_forest']['status'] == 'success':
            pred = self._predict_ml(models['random_forest'], df, future_dates, days)
            predictions.append(pred)

        if not predictions:
            raise ValueError("No models trained successfully")

        weights = [1.0 / len(predictions)] * len(predictions)

        ensemble_pred = np.zeros(days)
        for pred, weight in zip(predictions, weights):
            ensemble_pred += pred * weight

        historical_errors = self._calculate_historical_errors(df)
        simulations = []

        error_std = np.std(historical_errors) if len(historical_errors) > 0 else 0.1

        for _ in range(n_simulations):
            if len(historical_errors) > 0:
                sampled_errors = np.random.choice(historical_errors, size=days, replace=True)
            else:
                sampled_errors = np.zeros(days)
            noise = np.random.normal(0, error_std * 0.5, days)
            simulation = ensemble_pred + sampled_errors + noise
            simulations.append(np.maximum(simulation, 0))

        simulations = np.array(simulations)

        return {
            'mean': np.mean(simulations, axis=0).tolist(),
            'median': np.median(simulations, axis=0).tolist(),
            'p5': np.percentile(simulations, 5, axis=0).tolist(),
            'p10': np.percentile(simulations, 10, axis=0).tolist(),
            'p25': np.percentile(simulations, 25, axis=0).tolist(),
            'p75': np.percentile(simulations, 75, axis=0).tolist(),
            'p90': np.percentile(simulations, 90, axis=0).tolist(),
            'p95': np.percentile(simulations, 95, axis=0).tolist(),
            'model_weights': dict(zip(['prophet', 'ets', 'xgboost', 'random_forest'], weights)),
            'all_simulations': simulations.tolist()
        }

    def _predict_ml(self, model_info: Dict, df: pd.DataFrame, future_dates: List, days: int) -> np.ndarray:
        features_df = self.add_features(df)
        last_df = features_df.tail(28).copy()

        predictions = []
        current_df = last_df.copy()

        for i, date in enumerate(future_dates):
            new_row = pd.DataFrame({'ds': [date], 'y': [0]})
            new_row = self.add_features(new_row)

            for col in model_info['features']:
                if col in new_row.columns:
                    if col.startswith('lag_'):
                        lag = int(col.split('_')[1])
                        if len(current_df) >= lag:
                            new_row[col] = current_df['y'].iloc[-lag]
                        else:
                            new_row[col] = current_df['y'].mean()
                    elif col.startswith('rolling_mean_'):
                        window = int(col.split('_')[2])
                        if len(current_df) >= window:
                            new_row[col] = current_df['y'].iloc[-window:].mean()
                        else:
                            new_row[col] = current_df['y'].mean()

            X_pred = self.scaler.transform(new_row[model_info['features']].values)
            pred = model_info['model'].predict(X_pred)[0]
            predictions.append(pred)

            new_row['y'] = pred
            current_df = pd.concat([current_df, new_row], ignore_index=True)

        return np.array(predictions)

    def _calculate_historical_errors(self, df: pd.DataFrame) -> np.ndarray:
        if len(df) < 30:
            return np.random.normal(0, df['y'].std() * 0.1, 1000) if df['y'].std() > 0 else np.zeros(1000)

        errors = []
        values = df['y'].values

        for i in range(7, len(values)):
            error = (values[i] - values[i - 1]) / (values[i - 1] + 1)
            errors.append(error)

        return np.array(errors)


forecaster = RealMLForecaster()


@app.post("/forecast")
async def forecast(request: Dict):
    data = request.get('data', [])
    days = request.get('forecast_days', 60)
    n_simulations = request.get('n_simulations', 1000)

    if not data:
        raise HTTPException(status_code=400, detail="No data provided")

    df = pd.DataFrame(data)
    df = df.rename(columns={'date': 'ds', 'revenue': 'y'})
    df['ds'] = pd.to_datetime(df['ds'])
    df = df.sort_values('ds')

    result = forecaster.predict_with_uncertainty(df, days, n_simulations)

    return {
        'success': True,
        'forecast': {
            'median': result['median'],
            'p10': result['p10'],
            'p90': result['p90'],
            'p5': result['p5'],
            'p95': result['p95'],
            'model_weights': result['model_weights']
        }
    }


@app.post("/anomalies")
async def detect_anomalies(request: Dict):
    data = request.get('data', [])

    if not data:
        raise HTTPException(status_code=400, detail="No data provided")

    df = pd.DataFrame(data)

    if 'revenue' not in df.columns:
        raise HTTPException(status_code=400, detail="Data must contain 'revenue' column")

    date_col = 'date' if 'date' in df.columns else 'ds'
    df_grouped = df.groupby(date_col)['revenue'].sum().reset_index()

    df_grouped['revenue_ma7'] = df_grouped['revenue'].rolling(7, min_periods=1).mean()
    df_grouped['revenue_std7'] = df_grouped['revenue'].rolling(7, min_periods=1).std()
    df_grouped['zscore'] = (df_grouped['revenue'] - df_grouped['revenue_ma7']) / (df_grouped['revenue_std7'] + 1)

    iso_forest = IsolationForest(contamination=0.1, random_state=42)
    features = df_grouped[['revenue', 'zscore']].fillna(0)
    predictions = iso_forest.fit_predict(features)

    anomalies = []
    for i, pred in enumerate(predictions):
        if pred == -1:
            anomalies.append({
                'date': str(df_grouped.iloc[i][date_col]),
                'revenue': float(df_grouped.iloc[i]['revenue']),
                'zscore': float(df_grouped.iloc[i]['zscore']),
                'severity': 'high' if abs(df_grouped.iloc[i]['zscore']) > 3 else 'medium'
            })

    return {'success': True, 'anomalies': anomalies}


@app.get("/health")
async def health():
    return {'status': 'healthy', 'service': 'ml-microservice'}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
