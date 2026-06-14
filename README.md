# Netelixir — ForecastAI

Enterprise-grade probabilistic forecasting platform for e-commerce revenue prediction across Google Ads, Meta Ads, and Microsoft Ads channels.

---

## Architecture Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER                                  │
│                                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐       │
│  │ Dashboard │  │ Forecast │  │  Budget  │  │   Analytics      │       │
│  │  (P10-90) │  │  Engine  │  │Optimizer │  │ Anomalies/Causal │       │
│  └─────┬─────┘  └─────┬────┘  └────┬─────┘  └────────┬─────────┘       │
│        │              │            │                  │                  │
│        └──────────────┴────────────┴──────────────────┘                  │
│                           │  React + Recharts + Zustand                 │
│                           │  (port 3000)                                │
└───────────────────────────┼─────────────────────────────────────────────┘
                            │  HTTP / WebSocket
                            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         API GATEWAY (Nginx)                             │
│                    Reverse Proxy + Rate Limiting                        │
└───────────────────────────┬─────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          BACKEND LAYER (port 3001)                      │
│                                                                         │
│  ┌──────────┐  ┌──────────────────┐  ┌──────────────────────────┐      │
│  │  Auth &  │  │   Controllers    │  │       Middleware          │      │
│  │  Upload  │  │ ┌──────────────┐ │  │ ┌────────┐ ┌──────────┐ │      │
│  │          │  │ │  Forecast    │ │  │ │  Rate  │ │ Validation│ │      │
│  │ JWT +    │  │ │  Budget      │ │  │ │Limiter │ │ + Auth    │ │      │
│  │ Multer   │  │ │  Analytics   │ │  │ ├────────┤ ├──────────┤ │      │
│  │ (CSV)    │  │ │  Holidays    │ │  │ │ Error  │ │ Monitoring│ │      │
│  └──────────┘  │ │  Health      │ │  │ │Handler │ │ + Metrics │ │      │
│                │ └──────────────┘ │  │ └────────┘ └──────────┘ │      │
│                └──────────────────┘  └──────────────────────────┘      │
└───────────────────────────┬─────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        ML PIPELINE (Services)                           │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                   4-Model Ensemble                                │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │   │
│  │  │ Prophet  │  │   ETS    │  │  Random  │  │  Gradient    │   │   │
│  │  │ (Trend + │  │(Exponent.│  │  Forest  │  │  Boosting    │   │   │
│  │  │Seasonal) │  │ Smooth)  │  │ (Bagging)│  │ (XGB-like)   │   │   │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────┬───────┘   │   │
│  │       └──────┬──────┴──────┬──────┴───────┘                   │   │
│  │              ▼              ▼                                  │   │
│  │     ┌──────────────┐ ┌────────────────┐                       │   │
│  │     │   Blending   │ │ Monte Carlo    │                       │   │
│  │     │  (Weighted)  │ │ Simulation     │                       │   │
│  │     └──────┬───────┘ │ (500+ iters)   │                       │   │
│  │            │         └───────┬────────┘                       │   │
│  │            └─────────┬───────┘                                │   │
│  │                      ▼                                        │   │
│  │          ┌──────────────────────┐                             │   │
│  │          │  Probabilistic       │                             │   │
│  │          │  Output (P10/P50/P90)│                             │   │
│  │          └──────────────────────┘                             │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                  Analytics Services                              │   │
│  │  ┌────────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐   │   │
│  │  │  Anomaly   │ │  Causal  │ │ Campaign │ │  Seasonality  │   │   │
│  │  │  Detection │ │ Inference│ │Analysis  │ │  Detector     │   │   │
│  │  └────────────┘ └──────────┘ └──────────┘ └───────────────┘   │   │
│  │  ┌────────────┐ ┌──────────┐ ┌──────────┐                    │   │
│  │  │   ROAS     │ │  Budget  │ │  Data    │                    │   │
│  │  │ Optimizer  │ │Optimizer │ │Validator │                    │   │
│  │  └────────────┘ └──────────┘ └──────────┘                    │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │               LLM AI INSIGHTS (Groq → Gemini)                    │   │
│  │  ┌────────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐   │   │
│  │  │  Forecast  │ │  Anomaly │ │  Risk    │ │  Budget       │   │   │
│  │  │  Explain   │ │Interpret │ │ Identify │ │  Recommend    │   │   │
│  │  └────────────┘ └──────────┘ └──────────┘ └───────────────┘   │   │
│  │  ┌────────────┐ ┌──────────┐                                   │   │
│  │  │  Causal    │ │ Fallback │                                   │   │
│  │  │  Summary   │ │ (no-API) │                                   │   │
│  │  └────────────┘ └──────────┘                                   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │               Infrastructure Services                           │   │
│  │  ┌────────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐   │   │
│  │  │  SQLite    │ │  Redis   │ │WebSocket │ │Swagger Docs   │   │   │
│  │  │  (DB)      │ │  (Cache) │ │(Realtime)│ │  (OpenAPI)    │   │   │
│  │  └────────────┘ └──────────┘ └──────────┘ └───────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

## Data Flow

```
User Uploads CSV
      │
      ▼
  ┌──────────┐     ┌──────────────┐     ┌─────────────────┐
  │ Validate  │────►│ Store in     │────►│ 4-Model Ensemble│
  │ & Parse   │     │ SQLite       │     │ Forecast        │
  └──────────┘     └──────────────┘     └────────┬────────┘
                                                  │
         ┌────────────────────────────────────────┘
         ▼
  ┌──────────────┐     ┌────────────────┐     ┌──────────────┐
  │ Monte Carlo  │────►│ Budget Opt.    │────►│ Export CSV   │
  │ Simulation   │     │ Elasticity     │     │ / Realtime   │
  └──────────────┘     └────────────────┘     └──────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Tailwind CSS, Recharts, Zustand, React Query |
| Backend | Node.js, Express, TypeScript |
| ML Engine | 4-model ensemble (Prophet, ETS, Random Forest, Gradient Boosting) + Monte Carlo |
| Database | SQLite (better-sqlite3) |
| Cache | node-cache (in-memory) |
| Realtime | Socket.IO (WebSocket) |
| Auth | JWT |
| Docs | Swagger / OpenAPI |
| Monitoring | prom-client (Prometheus metrics) |
| LLM AI | Groq API (primary) + Gemini API (fallback) for insights |
| Container | Docker, Docker Compose, Nginx |

## Quick Start

### Development

```bash
# Backend
cd forecastai-app/backend && npm install && npm run dev

# Frontend
cd forecastai-app/frontend && npm install && npm run dev

# Access at http://localhost:3000
```

### Production (Docker)

```bash
cd forecastai-app && docker-compose up -d --build
# Access at http://localhost:3000
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/auth/register` | POST | Register user |
| `/api/auth/login` | POST | Login |
| `/api/upload/csv` | POST | Upload CSV data |
| `/api/forecast/generate` | POST | Generate forecast (async) |
| `/api/forecast/status/:id` | GET | Forecast job status |
| `/api/forecast/export/:id` | GET | Export forecast CSV |
| `/api/forecast/compare` | POST | Compare multiple forecasts |
| `/api/budget/simulate` | POST | What-if budget simulation |
| `/api/budget/optimize` | POST | Budget allocation optimization |
| `/api/budget/elasticity/:channel` | GET | Elasticity curve data |
| `/api/analytics/metrics` | POST | Performance metrics |
| `/api/analytics/anomalies` | POST | Anomaly detection |
| `/api/analytics/causal` | POST | Causal impact analysis |
| `/api/analytics/campaigns` | POST | Campaign analysis |
| `/api/analytics/seasonality` | POST | Seasonality detection |
| `/api/analytics/roas-optimize` | POST | ROAS optimization |
| `/api/analytics/validate` | POST | Data validation |
| `/api/analytics/insights` | POST | Operational insights |
| `/api/analytics/explain/anomaly` | POST | AI anomaly interpretation |
| `/api/analytics/explain/forecast` | POST | AI forecast explanation |
| `/api/analytics/risks` | POST | AI operational risk identification |
| `/api/analytics/budget-advice` | POST | AI budget recommendations |
| `/api/analytics/causal-summary` | POST | AI causal summary |
| `/api/holidays` | GET | Holiday calendar |
| `/api/holidays/upcoming` | GET | Upcoming holidays |
| `/api/holidays/check/:date` | GET | Check holiday impact |

## ML Pipeline

The forecasting engine uses a **4-model ensemble** with **Monte Carlo simulation**:

1. **Prophet-like** — Piecewise linear trend with seasonality decomposition
2. **ETS** — Exponential smoothing for level/trend/seasonality
3. **Random Forest** — Bootstrap-aggregated decision trees
4. **Gradient Boosting** — Iterative residual correction

Output: Probabilistic forecasts at **P10/P25/P50/P75/P90** confidence levels.

## LLM AI Integration

The platform uses **Groq API (primary)** with **Gemini API (fallback)** for AI-powered insights:

| Feature | Endpoint | Description |
|---------|----------|-------------|
| **Forecast Explanation** | `POST /api/analytics/explain/forecast` | Human-readable explanation of forecast results |
| **Anomaly Interpretation** | `POST /api/analytics/explain/anomaly` | Explains why anomalies occurred |
| **Risk Identification** | `POST /api/analytics/risks` | Identifies top operational risks |
| **Budget Recommendations** | `POST /api/analytics/budget-advice` | AI-driven budget reallocation advice |
| **Causal Summary** | `POST /api/analytics/causal-summary` | Executive summary of causal drivers |

The service automatically falls back to Gemini if Groq is unavailable, and uses rule-based fallbacks if neither API key is set.

## Project Structure

```
netelixir/
└── forecastai-app/
    ├── frontend/              # React SPA (Vite)
    │   ├── src/
    │   │   ├── components/    # Layout, charts, upload, common
    │   │   ├── pages/         # Dashboard, Forecast, Budget, Analytics
    │   │   ├── services/      # API integration layer
    │   │   ├── store/         # Zustand state management
    │   │   ├── hooks/         # React Query hooks
    │   │   └── types/         # TypeScript definitions
    │   └── ...
    ├── backend/               # Express API
    │   ├── src/
    │   │   ├── controllers/   # Route handlers
    │   │   ├── services/      # ML pipeline, analytics, business logic
    │   │   ├── middleware/    # Auth, validation, rate limiting, error handling
    │   │   ├── models/        # Type/interface definitions
    │   │   └── utils/         # Logger, cache, errors
    │   └── ...
    ├── docker-compose.yml
    ├── Dockerfile.frontend
    ├── Dockerfile.backend
    └── nginx.conf
```

## Environment Variables

See `forecastai-app/backend/.env`:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3001 | API server port |
| `NODE_ENV` | development | Environment |
| `CORS_ORIGIN` | http://localhost:3000 | Allowed CORS origin |
| `RATE_LIMIT_WINDOW_MS` | 900000 | Rate limit window (15min) |
| `RATE_LIMIT_MAX_REQUESTS` | 100 | Max requests per window |
| `GROQ_API_KEY` | — | Groq API key (primary LLM, free tier) |
| `GEMINI_API_KEY` | — | Gemini API key (fallback LLM, free tier) |

## License

Proprietary. All rights reserved.
