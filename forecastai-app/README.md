# ForecastAI | Premium Intelligence Platform

Enterprise-grade probabilistic forecasting platform for e-commerce revenue prediction across Google Ads, Meta Ads, and Microsoft Ads channels.

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Recharts, Zustand, React Query
- **Backend**: Node.js, Express, TypeScript
- **ML Engine**: 4-model ensemble (Prophet, ETS, Random Forest, Gradient Boosting) with Monte Carlo simulation
- **Containerization**: Docker, Docker Compose, Nginx

## Architecture

### Frontend (`frontend/`)
- 4 pages: Dashboard, Forecast Engine, Budget Optimizer, Analytics Dashboard
- Dark cyberpunk theme with glassmorphism effects
- Responsive design (mobile, tablet, desktop)
- State management via Zustand
- API integration via Axios + React Query

### Backend (`backend/`)
- REST API on port 3001
- ML forecasting pipeline ported from Python to TypeScript
- Budget optimization with elasticity modeling
- Anomaly detection, causal inference, campaign analysis
- Rate limiting, caching, input validation

## Quick Start

### Development

```bash
# Frontend
cd frontend && npm install && npm run dev

# Backend
cd backend && npm install && npm run dev

# Access at http://localhost:3000
```

### Production (Docker)

```bash
docker-compose up -d --build
# Access at http://localhost:3000
```

## API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/api/health` | GET | Health check |
| `/api/upload/csv` | POST | Upload and validate CSV |
| `/api/forecast/generate` | POST | Generate forecast |
| `/api/forecast/status/:id` | GET | Forecast status |
| `/api/forecast/export/:id` | GET | Export CSV |
| `/api/budget/simulate` | POST | What-if simulation |
| `/api/budget/optimize` | POST | Budget optimization |
| `/api/budget/elasticity/:channel` | GET | Elasticity curve |
| `/api/analytics/metrics` | POST | Performance metrics |
| `/api/analytics/anomalies` | POST | Anomaly detection |
| `/api/analytics/causal` | POST | Causal analysis |

## ML Pipeline

The forecasting engine uses a 4-model ensemble:
1. **Prophet-like**: Piecewise linear trend with seasonality
2. **ETS**: Exponential smoothing
3. **Random Forest**: Bootstrap-aggregated decision trees
4. **Gradient Boosting**: Iterative residual correction

Monte Carlo simulation generates probabilistic outputs (P10/P25/P50/P75/P90) with configurable confidence levels.

## Project Structure

```
forecastai-app/
├── frontend/          # React SPA
│   ├── src/
│   │   ├── components/  # Layout, common, charts, upload
│   │   ├── pages/       # Dashboard, Forecast, Budget, Analytics
│   │   ├── services/    # API integration layer
│   │   ├── store/       # Zustand state management
│   │   ├── hooks/       # React Query hooks
│   │   └── types/       # TypeScript type definitions
│   └── ...
├── backend/           # Express API
│   ├── src/
│   │   ├── controllers/ # Route handlers
│   │   ├── services/    # Business logic, ML pipeline
│   │   ├── models/      # Type definitions
│   │   └── middleware/   # Error handling, validation, rate limiting
│   └── ...
├── docker-compose.yml
├── Dockerfile.frontend
├── Dockerfile.backend
└── nginx.conf
```

## Environment Variables

See `backend/.env` for configuration options:

| Variable | Default | Description |
|---|---|---|
| `PORT` | 3001 | API server port |
| `NODE_ENV` | development | Environment |
| `CORS_ORIGIN` | http://localhost:3000 | Allowed CORS origin |
| `RATE_LIMIT_WINDOW_MS` | 900000 | Rate limit window |
| `RATE_LIMIT_MAX_REQUESTS` | 100 | Max requests per window |

## License

Proprietary. All rights reserved.
