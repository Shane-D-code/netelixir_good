# ForecastAI — Probabilistic E-commerce Revenue Forecasting

Enterprise-grade probabilistic forecasting platform for e-commerce revenue prediction across Google Ads, Meta Ads, and Microsoft Ads channels.

---

# 📋 Overview

ForecastAI is an AI-assisted forecasting utility designed for digital marketing agencies to predict future revenue and ROAS across multiple advertising channels. It combines statistical modeling, machine learning, and LLM-powered insights to generate probabilistic forecasts with confidence intervals.

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| Probabilistic Forecasting | 5-model ensemble with Monte Carlo simulation (P5–P95 confidence intervals) |
| Multi-Channel Support | Google Ads, Meta Ads, and Microsoft Ads decomposition |
| Budget Optimization | Elasticity modeling, ROAS maximization, and what-if analysis |
| AI Insights | Groq + Gemini integration for explanations and recommendations |
| Real-Time Updates | WebSocket progress tracking |
| Advanced Analytics | Anomaly detection, causal inference, seasonality detection |
| Export Support | CSV, Excel, PDF, and JSON |
| Authentication | JWT-secured APIs |
| API Documentation | Swagger/OpenAPI |

---

# 🚀 Quick Start

## Prerequisites

| Requirement | Version |
|-------------|---------|
| Node.js | 18+ |
| npm | 9+ |
| Python | 3.10+ |
| pip | Latest |

Verify installation:

```bash
node -v
npm -v
python3 --version
```

---

## One-Command Startup

```bash
git clone https://github.com/yourusername/netelixir_good.git
cd netelixir_good

chmod +x start.sh
./start.sh
```

Stop all services using:

```bash
Ctrl + C
```

---

## Manual Startup

### Terminal 1 — ML Service

```bash
cd forecastai-app/ml-service

python3 -m venv .venv
source .venv/bin/activate

pip install -r requirements.txt

uvicorn core.app:app \
    --host 0.0.0.0 \
    --port 8001 \
    --reload
```

---

### Terminal 2 — Backend

```bash
cd forecastai-app/backend

cp .env.example .env

npm install
npm run dev
```

---

### Terminal 3 — Frontend

```bash
cd forecastai-app/frontend

npm install
npm run dev
```

---

# 🌐 Access URLs

| Service | URL |
|----------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:3001 |
| ML Service | http://localhost:8001 |
| Swagger Docs | http://localhost:3001/api-docs |
| Metrics | http://localhost:3001/api/metrics |

---

# ⚙️ Environment Variables

Create a `.env` file:

```bash
cp .env.example .env
```

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 3001 | Backend port |
| NODE_ENV | development | Environment |
| CORS_ORIGIN | http://localhost:3000 | Allowed frontend |
| JWT_SECRET | — | Authentication secret |
| DATABASE_PATH | ./data/forecastai.db | SQLite database |
| ML_SERVICE_URL | http://localhost:8001 | ML API URL |
| GROQ_API_KEY | — | Groq API key |
| GEMINI_API_KEY | — | Gemini API key |
| REDIS_URL | — | Optional Redis |
| RATE_LIMIT_MAX_REQUESTS | 100 | Per 15 minutes |

> **Note:** The application works without Groq/Gemini using rule-based fallbacks.

---

# 📁 Project Structure

```text
netelixir_good/
│
├── .env.example
├── start.sh
├── run.sh
├── requirements.txt
│
├── data/
├── output/
├── pickle/
│
├── scripts/
│   └── train_and_save_model.py
│
├── src/
│   ├── generate_features.py
│   └── predict.py
│
└── forecastai-app/
    ├── frontend/
    │   ├── src/
    │   ├── package.json
    │   └── tailwind.config.js
    │
    ├── backend/
    │   ├── src/
    │   ├── package.json
    │   └── tsconfig.json
    │
    ├── ml-service/
    │   ├── core/
    │   ├── features/
    │   └── requirements.txt
    │
    ├── docs/
    │   ├── API.md
    │   ├── ARCHITECTURE.md
    │   ├── DEPLOYMENT.md
    │   └── FEATURES.md
    │
    └── data/
```

---

# 🏗️ Architecture

```text
                    CLIENT
      React + Tailwind + Zustand + Recharts
                     │
          HTTP / WebSocket
                     │
                     ▼
      Express + TypeScript Backend
      JWT • SQLite • Socket.IO
      Swagger • Prometheus
                     │
                     ▼
          FastAPI ML Service
 StatsForecast • scikit-learn
 Monte Carlo • Ensemble Models
```

---

# 🤖 Machine Learning Pipeline

The forecasting engine uses a **5-model ensemble** combined with Monte Carlo simulation.

| Model | Purpose |
|-------|----------|
| AutoARIMA | Automatic ARIMA forecasting |
| AutoETS | Exponential smoothing |
| AutoTheta | Trend decomposition |
| SeasonalNaive | Seasonal baseline |
| HistoricAverage | Historical average baseline |

### Ensemble Strategy

- Backtesting using inverse MAPE weighting
- Adaptive model weighting
- 1000+ Monte Carlo simulations
- Prediction intervals:
  - P5
  - P10
  - P25
  - P50
  - P75
  - P90
  - P95

### Additional ML Features

- Isolation Forest anomaly detection
- Causal inference
- FFT seasonality analysis
- Driver attribution

---

# 🧠 AI Integration

ForecastAI integrates:

- **Groq (Primary)**
- **Gemini (Fallback)**

| Endpoint | Purpose |
|-----------|----------|
| `/api/analytics/explain/forecast` | Forecast explanation |
| `/api/analytics/explain/anomaly` | Explain anomalies |
| `/api/analytics/risks` | Risk detection |
| `/api/analytics/budget-advice` | Budget recommendations |
| `/api/analytics/causal-summary` | Executive summary |

If neither API key is available, ForecastAI automatically switches to deterministic rule-based insights.

---

# 📡 REST API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/auth/register` | POST | Register |
| `/api/auth/login` | POST | Login |
| `/api/upload/csv` | POST | Upload CSV |
| `/api/forecast/generate` | POST | Generate forecast |
| `/api/forecast/status/:id` | GET | Forecast status |
| `/api/forecast/export/:id` | GET | Export forecast |
| `/api/budget/simulate` | POST | Budget simulation |
| `/api/budget/optimize` | POST | Budget optimization |
| `/api/analytics/metrics` | POST | Metrics |
| `/api/analytics/anomalies` | POST | Detect anomalies |
| `/api/analytics/causal` | POST | Causal analysis |
| `/api/analytics/campaigns` | POST | Campaign analytics |
| `/api/analytics/seasonality` | POST | Seasonality |
| `/api/analytics/roas-optimize` | POST | ROAS optimization |
| `/api/analytics/insights` | POST | Operational insights |

Complete API documentation is available at:

```
/api-docs
```

---

# 🧪 Testing

## Backend

```bash
cd forecastai-app/backend
npm test
```

## Frontend

```bash
cd forecastai-app/frontend
npm test
```

## ML Service

```bash
cd forecastai-app/ml-service

source .venv/bin/activate

pytest tests/
```

---

# 🐳 Docker

```bash
docker-compose up -d
```

Services:

| Service | URL |
|----------|-----|
| Frontend | http://localhost:3000 |
| Backend | http://localhost:3001 |
| ML Service | http://localhost:8001 |

---

# 🤝 Contributing

```bash
git checkout -b feature/your-feature

git commit -m "feat: your feature"

git push origin feature/your-feature
```

Then create a Pull Request.

---

# 📚 Documentation

- API Reference → `docs/API.md`
- Architecture → `docs/ARCHITECTURE.md`
- Deployment Guide → `docs/DEPLOYMENT.md`
- Features → `docs/FEATURES.md`

---

# 📄 License

**Proprietary** — All Rights Reserved.
