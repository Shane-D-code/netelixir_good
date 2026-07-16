# 📝 REWRITE README.md – Complete Clean Version

```markdown
# ForecastAI — Probabilistic E-commerce Revenue Forecasting

Enterprise-grade probabilistic forecasting platform for e-commerce revenue prediction across Google Ads, Meta Ads, and Microsoft Ads channels.

---

## 📋 Overview

ForecastAI is an AI-assisted forecasting utility designed for digital marketing agencies to predict future revenue and ROAS across multiple ad channels. It combines statistical modeling, machine learning, and LLM-powered insights to provide probabilistic forecasts with confidence intervals.

### Key Features

| Feature | Description |
|---------|-------------|
| **Probabilistic Forecasting** | 5-model ensemble with Monte Carlo simulation (P5-P95 confidence) |
| **Multi-Channel Support** | Google Ads, Meta Ads, Microsoft Ads channel decomposition |
| **Budget Optimization** | Elasticity modeling, ROAS maximization, what-if scenarios |
| **AI-Powered Insights** | Groq + Gemini LLM integration for forecast explanations, risk identification, and budget recommendations |
| **Real-Time Updates** | WebSocket progress tracking during forecast generation |
| **Comprehensive Analytics** | Anomaly detection, causal inference, campaign decomposition, seasonality detection, risk metrics |
| **Exportable Reports** | CSV, Excel, PDF, and JSON exports |
| **JWT Authentication** | Secure user authentication and route protection |
| **Swagger API Docs** | Auto-generated OpenAPI documentation |

---

## 🚀 Quick Start

### Prerequisites

| Requirement | Version |
|-------------|---------|
| Node.js | >= 18.x |
| npm | >= 9.x |
| Python | >= 3.10 |
| pip3 | Comes with Python |

```bash
node -v    # v18.x or higher
npm -v     # 9.x or higher
python3 --version  # 3.10 or higher
```

### One-Command Startup (Recommended)

```bash
git clone https://github.com/yourusername/netelixir_good.git
cd netelixir_good
chmod +x start.sh
./start.sh
```

Press **Ctrl+C** to stop all services.

### Manual Startup (3 Terminals)

**Terminal 1 — ML Service (Python FastAPI):**
```bash
cd forecastai-app/ml-service
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn core.app:app --host 0.0.0.0 --port 8001 --reload
```

**Terminal 2 — Backend (Node.js):**
```bash
cd forecastai-app/backend
cp .env.example .env   # Configure environment variables
npm install
npm run dev
```

**Terminal 3 — Frontend (React):**
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

## 🔧 Environment Variables

Copy `.env.example` to `.env` in the project root:

```bash
cp .env.example .env
```

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3001 | Backend API port |
| `NODE_ENV` | development | Environment mode |
| `CORS_ORIGIN` | http://localhost:3000 | Allowed CORS origin |
| `JWT_SECRET` | — | JWT signing secret (set a strong value) |
| `DATABASE_PATH` | ./data/forecastai.db | SQLite database path |
| `ML_SERVICE_URL` | http://localhost:8001 | ML microservice URL |
| `GROQ_API_KEY` | — | Groq API key (optional, free tier available) |
| `GEMINI_API_KEY` | — | Gemini API key (optional, fallback for Groq) |
| `REDIS_URL` | — | Redis URL (optional, falls back to in-memory cache) |
| `RATE_LIMIT_MAX_REQUESTS` | 100 | Max requests per 15-minute window |

> **Note:** LLM AI insights (Groq/Gemini) are optional. The app works fully without them using rule-based fallbacks.

---

## 📁 Project Structure

```
netelixir_good/
├── .env.example              # Environment template
├── start.sh                  # One-command startup script
├── run.sh                    # CLI entry point for hackathon submission
├── requirements.txt          # Python dependencies for CLI pipeline
├── data/                     # Input data (sample CSV)
├── pickle/                   # Trained model (pickle file)
├── output/                   # Forecast output directory
├── src/                      # CLI pipeline source
│   ├── generate_features.py
│   └── predict.py
├── scripts/                  # Training scripts
│   └── train_and_save_model.py
└── forecastai-app/
    ├── frontend/             # React SPA (Vite + TypeScript)
    │   ├── src/
    │   │   ├── features/     # Dashboard, Forecast, Budget, Analytics, Alerts
    │   │   ├── services/     # API integration, WebSocket client
    │   │   ├── store/        # Zustand state management
    │   │   └── shared/       # Layout, UI components, styles
    │   ├── package.json
    │   └── tailwind.config.js
    ├── backend/              # Express API (TypeScript)
    │   ├── src/
    │   │   ├── features/     # Auth, Forecasting, Analytics, Budget, LLM
    │   │   ├── core/         # Database, Config, Cache, Monitoring
    │   │   └── shared/       # Middleware, Types, Utils
    │   ├── package.json
    │   └── tsconfig.json
    ├── ml-service/           # Python FastAPI ML microservice
    │   ├── core/             # FastAPI app entry point
    │   ├── features/         # Forecasting, Anomaly, Causal
    │   └── requirements.txt
    ├── docs/                 # Documentation
    │   ├── API.md
    │   ├── ARCHITECTURE.md
    │   ├── DEPLOYMENT.md
    │   └── FEATURES.md
    └── data/                 # SQLite database (auto-created)
```

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     CLIENT (port 3000)                       │
│           React + Recharts + Zustand + Tailwind             │
└────────────────────────┬─────────────────────────────────────┘
                         │ HTTP / WebSocket
                         ▼
┌──────────────────────────────────────────────────────────────┐
│                   BACKEND (port 3001)                        │
│   Express + TypeScript + SQLite + JWT + Socket.IO           │
│   Swagger Docs · Prometheus Metrics · Rate Limiting         │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│                  ML SERVICE (port 8001)                      │
│   FastAPI + StatsForecast + scikit-learn + Monte Carlo      │
│   AutoARIMA · AutoETS · AutoTheta · SeasonalNaive           │
│   Anomaly Detection · Causal Inference                      │
└──────────────────────────────────────────────────────────────┘
```

### ML Pipeline

The forecasting engine uses a **5-model ensemble** with **Monte Carlo simulation**:

| Model | Description |
|-------|-------------|
| **AutoARIMA** | Automatic ARIMA model selection with seasonal decomposition |
| **AutoETS** | Exponential smoothing with automatic parameter tuning |
| **AutoTheta** | Theta method for trend decomposition |
| **SeasonalNaive** | Seasonal baseline model |
| **HistoricAverage** | Historical mean baseline |

- Models weighted via **backtesting** (inverse MAPE weighting)
- **Monte Carlo simulation** (1000+ iterations) for probabilistic forecasts
- Confidence levels: **P5, P10, P25, P50, P75, P90, P95**
- **Adaptive ensemble** - dynamic weight adjustment based on recent performance

### Additional ML Capabilities

- **Anomaly Detection** — IsolationForest from scikit-learn
- **Causal Inference** — Lag correlation, driver attribution, anomaly-cause linking
- **Seasonality Detection** — ACF autocorrelation + FFT spectral analysis

---

## 🤖 LLM AI Integration

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

## 📊 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/auth/register` | POST | Register user |
| `/api/auth/login` | POST | Login |
| `/api/upload/csv` | POST | Upload CSV data |
| `/api/forecast/generate` | POST | Generate forecast (async, returns jobId) |
| `/api/forecast/status/:id` | GET | Forecast job status |
| `/api/forecast/export/:id` | GET | Export forecast CSV |
| `/api/budget/simulate` | POST | What-if budget simulation |
| `/api/budget/optimize` | POST | Budget allocation optimization |
| `/api/analytics/metrics` | POST | Performance metrics |
| `/api/analytics/anomalies` | POST | Anomaly detection |
| `/api/analytics/causal` | POST | Causal impact analysis |
| `/api/analytics/campaigns` | POST | Campaign analysis |
| `/api/analytics/seasonality` | POST | Seasonality detection |
| `/api/analytics/roas-optimize` | POST | ROAS optimization |
| `/api/analytics/insights` | POST | Operational insights |

Full API documentation available at `/api-docs`.

---

## 🧪 Testing

### Backend Tests
```bash
cd forecastai-app/backend
npm test
```

### Frontend Tests
```bash
cd forecastai-app/frontend
npm test
```

### ML Service Tests
```bash
cd forecastai-app/ml-service
source .venv/bin/activate
pytest tests/
```

---

## 🐳 Docker Deployment

```bash
docker-compose up -d
```

Services start on their respective ports:
- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- ML Service: http://localhost:8001

---

## 📄 License

Proprietary. All rights reserved.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m "feat: your feature description"`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Create a Pull Request

---

## 📚 Documentation

- [API Reference](docs/API.md)
- [Architecture Overview](docs/ARCHITECTURE.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Features Documentation](docs/FEATURES.md)
```
