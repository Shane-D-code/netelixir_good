# ForecastAI Architecture

## System Overview
ForecastAI is an AI-powered e-commerce forecasting platform with three main components:
1. **Frontend** - React SPA with TypeScript and Tailwind CSS
2. **Backend** - Node.js/Express API with TypeScript
3. **ML Service** - Python/FastAPI microservice

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite (build tool)
- Tailwind CSS (styling)
- Recharts (charts)
- Zustand (state management)
- React Router (routing)
- React Query (server state)
- Socket.IO Client (WebSocket)

### Backend
- Node.js with Express
- TypeScript
- SQLite (better-sqlite3)
- Socket.IO (WebSocket server)
- JWT (authentication)
- Winston (logging)
- Swagger (API docs)
- Prometheus (metrics)

### ML Service
- Python 3.10
- FastAPI
- Prophet (time series)
- Statsmodels (ETS)
- XGBoost (gradient boosting)
- Scikit-learn (Random Forest)
- SHAP (causal inference)

## Data Flow
1. User uploads CSV data via frontend
2. Backend parses and validates data
3. Backend sends data to ML service (with TypeScript fallback)
4. ML service runs ensemble forecast (Prophet + ETS + XGBoost + RF)
5. Monte Carlo simulation generates confidence intervals
6. Backend computes anomalies, causal drivers, risk metrics
7. Results sent back to frontend via WebSocket and REST
8. Frontend renders interactive charts and insights

## ML Pipeline
- Dynamic model weights via 3-fold cross-validation
- Ensemble: Prophet (0.35), ETS (0.25), RF (0.25), GB (0.15) - adjusted by CV
- Monte Carlo simulation (500 iterations)
- Percentiles: P5, P10, P25, P50, P75, P90, P95

## Security
- JWT authentication with Bearer tokens
- CORS configuration
- Rate limiting (100 req/15min global, 10 req/min forecast)
- Helmet security headers
- Input validation
