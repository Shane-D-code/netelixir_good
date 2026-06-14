import shap
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor


class CausalInference:
    """SHAP-based causal inference"""

    def __init__(self):
        self.model = None
        self.explainer = None

    def analyze_drivers(self, df: pd.DataFrame, target_col: str = 'revenue'):
        """Identify causal drivers using SHAP"""

        feature_cols = ['google_revenue', 'meta_revenue', 'microsoft_revenue',
                       'day_of_week', 'is_weekend', 'is_holiday']

        for channel in ['google', 'meta', 'microsoft']:
            if f'{channel}_revenue' not in df.columns:
                df[f'{channel}_revenue'] = 0

        if 'day_of_week' not in df.columns:
            df['day_of_week'] = pd.to_datetime(df.get('date', df.index)).dayofweek

        if 'is_weekend' not in df.columns:
            df['is_weekend'] = (df['day_of_week'] >= 5).astype(int)

        if 'is_holiday' not in df.columns:
            import holidays
            us_holidays = holidays.US()
            df['is_holiday'] = pd.to_datetime(df.get('date', df.index)).apply(
                lambda x: 1 if x in us_holidays else 0
            )

        X = df[feature_cols].fillna(0)
        y = df[target_col].fillna(0)

        self.model = RandomForestRegressor(n_estimators=100, random_state=42)
        self.model.fit(X, y)

        self.explainer = shap.TreeExplainer(self.model)
        shap_values = self.explainer.shap_values(X)

        feature_importance = pd.DataFrame({
            'feature': feature_cols,
            'importance': np.abs(shap_values).mean(axis=0),
            'shap_mean': np.abs(shap_values).mean(axis=0)
        }).sort_values('importance', ascending=False)

        return {
            'top_drivers': feature_importance.head(5).to_dict('records'),
            'channel_impact': {
                row['feature']: float(row['importance'])
                for _, row in feature_importance.iterrows()
                if 'revenue' in row['feature']
            }
        }
