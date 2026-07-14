# Netelixir — ForecastAI

Enterprise-grade probabilistic forecasting platform for e-commerce revenue prediction across Google Ads, Meta Ads, and Microsoft Ads channels.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Tailwind CSS, Recharts, Zustand, React Query |
| Backend | Node.js, Express, TypeScript |
| ML Engine | 5-model ensemble (AutoARIMA, AutoETS, AutoTheta, SeasonalNaive, HistoricAverage) + Monte Carlo |
| Database | SQLite (better-sqlite3) |
| Cache | node-cache (in-memory) |
| Realtime | Socket.IO (WebSocket) |
| Auth | JWT |
| Docs | Swagger / OpenAPI |
| Monitoring | prom-client (Prometheus metrics) |
| LLM AI | Groq API (primary) + Gemini API (fallback) for insights |

---

## Startup Guide (Without Docker)

### Prerequisites

Make sure you have the following installed:

- **Node.js** >= 18.x — [Download](https://nodejs.org/)
- **npm** >= 9.x (comes with Node)
- **Python** >= 3.10 — [Download](https://www.python.org/downloads/)
- **pip3** (comes with Python)

Verify your installation:

```bash
node -v    # v18.x or higher
npm -v     # 9.x or higher
python3 --version  # 3.10 or higher
pip3 --version
```

### Option A — One-Command Startup (Recommended)

From the project root:

```bash
chmod +x start.sh
./start.sh
```

This script will:
1. Check that all prerequisites are installed
2. Copy `.env.example` to `.env` if it doesn't exist
3. Install npm dependencies for backend and frontend (if missing)
4. Create a Python virtual environment and install ML service dependencies (if missing)
5. Start all 3 services in parallel

Press **Ctrl+C** to stop all services.

### Option B — Manual Startup (3 Terminals)

Open 3 separate terminal windows and run each command:

**Terminal 1 — ML Service (Python FastAPI):**

```bash
cd forecastai-app/ml-service
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn core.app:app --host 0.0.0.0 --port 8001 --reload
```

**Terminal 2 — Backend (Node.js Express):**

```bash
cd forecastai-app/backend
cp ../../.env.example .env   # or configure manually
npm install
npm run dev
```

**Terminal 3 — Frontend (React + Vite):**

```bash
cd forecastai-app/frontend
npm install
npm run dev
```

### Access Points

| Service | URL |
|---------|-----|
| Frontend UI | http://localhost:3000 |
| Backend API | http://localhost:3001 |
| ML Service API | http://localhost:8001 |
| Swagger API Docs | http://localhost:3001/api-docs |
| Prometheus Metrics | http://localhost:3001/api/metrics |

---

## Environment Variables

Copy `.env.example` to `.env` in the project root and configure:

```bash
cp .env.example .env
```

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3001 | Backend API port |
| `NODE_ENV` | development | Environment mode |
| `CORS_ORIGIN` | http://localhost:3000 | Allowed CORS origin |
| `RATE_LIMIT_WINDOW_MS` | 900000 | Rate limit window (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | 100 | Max requests per window |
| `DATABASE_PATH` | ./data/forecastai.db | SQLite database path |
| `JWT_SECRET` | — | JWT signing secret (set a strong value) |
| `ML_SERVICE_URL` | http://localhost:8001 | ML microservice URL |
| `GROQ_API_KEY` | — | Groq API key (optional, free tier available) |
| `GEMINI_API_KEY` | — | Gemini API key (optional, fallback for Groq) |
| `REDIS_URL` | — | Redis URL (optional, falls back to in-memory cache) |

> **Note:** LLM AI insights (Groq/Gemini) are optional. The app works fully without them using rule-based fallbacks.

---

## Project Structure

```
netelixir/
├── .env.example              # Environment template
├── start.sh                  # One-command startup (all 3 services)
├── forecastai-app/
│   ├── frontend/             # React SPA (Vite + TypeScript)
│   │   └── src/
│   │       ├── features/     # Dashboard, Forecast, Budget, Analytics, Alerts, etc.
│   │       ├── services/     # API integration, WebSocket client
│   │       ├── store/        # Zustand state management
│   │       └── shared/       # Layout, UI components, styles
│   ├── backend/              # Express API (TypeScript)
│   │   ├── src/
│   │   │   ├── features/     # Auth, Forecasting, Analytics, Budget, LLM, etc.
│   │   │   ├── core/         # Database, Config, Cache, Monitoring
│   │   │   └── shared/       # Middleware, Types, Utils
│   │   └── sample_data.csv   # Sample data for testing
│   ├── ml-service/           # Python FastAPI microservice
│   │   ├── core/             # FastAPI app entry point
│   │   ├── features/         # Forecasting, Anomaly Detection, Causal Inference
│   │   └── requirements.txt  # Python dependencies
│   ├── data/                 # SQLite database (auto-created)
│   └── docs/                 # API, Architecture, Deployment, Features docs
└── .github/workflows/ci.yml  # CI pipeline
```

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    CLIENT (port 3000)                     │
│           React + Recharts + Zustand + Tailwind          │
└────────────────────────┬─────────────────────────────────┘
                         │ HTTP / WebSocket
                         ▼
┌──────────────────────────────────────────────────────────┐
│                  BACKEND (port 3001)                      │
│   Express + TypeScript + SQLite + JWT + Socket.IO        │
│   Swagger Docs · Prometheus Metrics · Rate Limiting      │
└────────────────────────┬─────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────┐
│                 ML SERVICE (port 8001)                    │
│   FastAPI + StatsForecast + scikit-learn + Monte Carlo   │
│   AutoARIMA · AutoETS · AutoTheta · SeasonalNaive        │
│   Anomaly Detection · Causal Inference                    │
└──────────────────────────────────────────────────────────┘
```

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/auth/register` | POST | Register user |
| `/api/auth/login` | POST | Login |
| `/api/upload/csv` | POST | Upload CSV data |
| `/api/forecast/generate` | POST | Generate forecast |
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
| `/api/analytics/risks` | POST | AI risk identification |
| `/api/analytics/budget-advice` | POST | AI budget recommendations |
| `/api/analytics/causal-summary` | POST | AI causal summary |
| `/api/holidays` | GET | Holiday calendar |
| `/api/holidays/upcoming` | GET | Upcoming holidays |
| `/api/holidays/check/:date` | GET | Check holiday impact |

---

## ML Pipeline

The forecasting engine uses a **5-model ensemble** with **Monte Carlo simulation**:

1. **AutoARIMA** — Automatic ARIMA model selection
2. **AutoETS** — Exponential smoothing with automatic parameter tuning
3. **AutoTheta** — Theta method for trend decomposition
4. **SeasonalNaive** — Seasonal baseline model
5. **HistoricAverage** — Historical mean baseline

Models are weighted via **backtesting** on historical data. Monte Carlo simulation (500+ iterations) produces probabilistic forecasts at **P10/P25/P50/P75/P90** confidence levels.

Additional ML capabilities:
- **Anomaly Detection** — IsolationForest from scikit-learn
- **Causal Inference** — Lag correlation, driver attribution, anomaly-cause linking
- **Adaptive Ensemble** — Dynamic model weight adjustment based on recent performance

---

## LLM AI Integration

The platform uses **Groq API (primary)** with **Gemini API (fallback)** for AI-powered insights:

| Feature | Endpoint | Description |
|---------|----------|-------------|
| Forecast Explanation | `POST /api/analytics/explain/forecast` | Human-readable explanation of forecast results |
| Anomaly Interpretation | `POST /api/analytics/explain/anomaly` | Explains why anomalies occurred |
| Risk Identification | `POST /api/analytics/risks` | Identifies top operational risks |
| Budget Recommendations | `POST /api/analytics/budget-advice` | AI-driven budget reallocation advice |
| Causal Summary | `POST /api/analytics/causal-summary` | Executive summary of causal drivers |

The service automatically falls back to Gemini if Groq is unavailable, and uses rule-based fallbacks if neither API key is set.

---

## License

Proprietary. All rights reserved.
