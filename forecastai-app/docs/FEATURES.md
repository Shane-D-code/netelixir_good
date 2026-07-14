# ForecastAI Features

## Core Features

### 1. AI-Powered Forecasting
- Upload CSV data with date, revenue, and channel columns
- Ensemble ML models: Prophet, ETS, Random Forest, Gradient Boosting
- Dynamic model weights via 3-fold cross-validation
- Monte Carlo simulation (500 iterations) for confidence intervals
- Confidence bands: P5, P10, P25, P50, P75, P90, P95

### 2. Budget Optimization
- Simulate budget changes across channels
- Auto-optimize budget allocation for maximum ROAS
- Elasticity curves showing budget-to-revenue relationship
- Channel-specific elasticity coefficients

### 3. Analytics Dashboard
- Channel performance metrics
- Forecast accuracy (MAPE, RMSE, MAE, R²)
- Anomaly detection with Z-score analysis
- Causal driver importance analysis
- Campaign type decomposition
- Seasonality detection
- ROAS optimization
- Data quality validation

### 4. AI Insights (LLM-Powered)
- Executive summary generation
- Risk identification and analysis
- Budget recommendations
- Anomaly explanations
- Causal driver summaries

## Feature Modules

### 5. Goal Planner
- Set target revenue and time period
- Get required budget per channel
- Expected ROAS and confidence score
- AI-powered recommendations

### 6. Promotion Simulator
- Simulate discount promotions (0-50%)
- Price elasticity of demand model
- Before/after comparison
- Volume increase and margin impact estimates

### 7. Stress Testing
- 4 scenarios: CPC increase, CVR drop, Budget cut, Market downturn
- Revenue and ROAS impact analysis
- Confidence scores for each scenario
- Actionable recommendations
- Overall resilience score

### 8. Creative Fatigue Detector
- Fatigue scoring (0-100) per creative
- Performance trend detection
- Days until critical countdown
- Recommended actions: refresh, pause, maintain

### 9. Market Shock Simulator
- 3 shock types: competitor sale, algorithm update, supply chain
- Low/medium/high severity
- Impact gauge and recovery timeline
- Strategic recommendations

### 10. Alert Intelligence Engine
- Automated alert generation from data patterns
- Severity levels: critical, warning, info
- Root cause analysis
- Suggested actions
- Real-time WebSocket notifications
- Acknowledge and batch acknowledge

### 11. ROAS Time Machine
- Interactive budget allocation sliders
- 4 preset scenarios: Aggressive Meta, Balanced, Conservative, Optimal
- Real-time ROAS/revenue recalculation
- Before/after comparison
- Apply to current forecast

### 12. Executive Summary Reports
- Client name and date range
- 3 templates: Minimal, Detailed, Executive
- Customizable sections
- HTML preview
- PDF download
- Save as template

## Authentication
- Email-based registration and login
- JWT token authentication
- Protected routes
- Session persistence

## UI/UX
- Premium luxury design (#FAFAF8 + #C8A86B gold accent)
- Glass morphism cards
- Mobile responsive
- Real-time WebSocket updates
- Interactive charts (Recharts)
- Loading states and error handling
