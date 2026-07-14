# ForecastAI API Reference

## Base URL
```
http://localhost:3001/api
```

## Authentication
All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <token>
```

Obtain a token via `/auth/register` or `/auth/login`.

---

## Auth Endpoints

### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "name": "John Doe"
}
```
**Response:**
```json
{
  "success": true,
  "token": "jwt_token_here",
  "user": { "id": "uuid", "email": "user@example.com", "name": "John Doe" }
}
```

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com"
}
```

---

## Health Endpoints

### Health Check
```http
GET /api/health
```

### Readiness Check
```http
GET /api/health/readiness
```

---

## Upload Endpoints

### Upload CSV
```http
POST /api/upload/csv
Content-Type: multipart/form-data

file: data.csv
```

---

## Forecast Endpoints

### Generate Forecast
```http
POST /api/forecast/generate
Content-Type: multipart/form-data

file: data.csv
```

### Get Forecast Status
```http
GET /api/forecast/status/:id
```

### Export Forecast CSV
```http
GET /api/forecast/export/:id
```

### Export Multiple Formats
```http
GET /api/forecast/export/:id/:format
```

### Compare Forecasts
```http
POST /api/forecast/compare
Content-Type: application/json

{
  "actual": [100, 200, 300],
  "forecast": [110, 190, 310]
}
```

---

## Budget Endpoints

### Simulate Budget Change
```http
POST /api/budget/simulate
Content-Type: application/json

{
  "channel_budgets": { "Google Ads": 10000, "Meta Ads": 8000 },
  "new_budgets": { "Google Ads": 15000, "Meta Ads": 8000 }
}
```

### Optimize Budget Allocation
```http
POST /api/budget/optimize
Content-Type: application/json

{
  "channel_budgets": { "Google Ads": 10000, "Meta Ads": 8000, "Microsoft Ads": 5000 },
  "total_budget": 23000
}
```

### Get Elasticity Curve
```http
GET /api/budget/elasticity/:channel
```

---

## Analytics Endpoints

### Get Channel Metrics
```http
POST /api/analytics/metrics
Content-Type: application/json

{
  "data": [...],
  "channel_budgets": { "Google Ads": 10000 }
}
```

### Detect Anomalies
```http
POST /api/analytics/anomalies
Content-Type: application/json

{
  "data": [...]
}
```

### Causal Analysis
```http
POST /api/analytics/causal
Content-Type: application/json

{
  "data": [...],
  "channel_budgets": { "Google Ads": 10000 }
}
```

### Campaign Analysis
```http
POST /api/analytics/campaigns
Content-Type: application/json

{
  "data": [...]
}
```

### Seasonality Detection
```http
POST /api/analytics/seasonality
Content-Type: application/json

{
  "data": [...]
}
```

### ROAS Optimization
```http
POST /api/analytics/roas-optimize
Content-Type: application/json

{
  "data": [...],
  "channel_budgets": { "Google Ads": 10000 }
}
```

### Data Validation
```http
POST /api/analytics/validate
Content-Type: application/json

{
  "data": [...]
}
```

### Operational Insights
```http
POST /api/analytics/insights
Content-Type: application/json

{
  "data": [...],
  "channel_budgets": { "Google Ads": 10000 }
}
```

---

## AI Insight Endpoints

### Explain Anomaly
```http
POST /api/analytics/explain/anomaly
Content-Type: application/json

{
  "anomaly": { "date": "2024-01-15", "channel": "Google Ads", "zscore": -2.5 },
  "context": { ... }
}
```

### Explain Forecast
```http
POST /api/analytics/explain/forecast
Content-Type: application/json

{
  "forecastData": { "p50_revenue": 100000, "roas": 2.5 }
}
```

### Risk Analysis
```http
POST /api/analytics/risks
Content-Type: application/json

{
  "forecastData": { ... },
  "anomalies": [...]
}
```

### Budget Advice
```http
POST /api/analytics/budget-advice
Content-Type: application/json

{
  "budgets": { "Google Ads": 10000 },
  "roasByChannel": { "Google Ads": 2.5 }
}
```

### Causal Summary
```http
POST /api/analytics/causal-summary
Content-Type: application/json

{
  "causalDrivers": [...]
}
```

---

## Feature Endpoints

### Goal Planner
```http
POST /api/planner/goal
Content-Type: application/json

{
  "targetRevenue": 100000,
  "days": 30,
  "currentBudgets": { "Google Ads": 10000, "Meta Ads": 8000 }
}
```

### Promotion Simulator
```http
POST /api/promotion/simulate
Content-Type: application/json

{
  "discountPercent": 20,
  "currentRevenue": 50000,
  "currentAOV": 75,
  "profitMargin": 0.3,
  "elasticity": 1.5
}
```

### Stress Test
```http
POST /api/stress-test/run
Content-Type: application/json

{
  "data": [...],
  "budgets": { "Google Ads": 10000, "Meta Ads": 8000 }
}
```

### Creative Fatigue Detection
```http
POST /api/creative-fatigue/detect
Content-Type: application/json

{
  "creatives": [
    {
      "id": "1",
      "name": "Ad Creative 1",
      "channel": "Meta Ads",
      "dailyMetrics": [...]
    }
  ]
}
```

### Market Shock Simulation
```http
POST /api/market-shock/simulate
Content-Type: application/json

{
  "shockType": "competitor_sale",
  "severity": "medium",
  "data": [...],
  "budgets": { "Google Ads": 10000 }
}
```

### Alerts

#### Generate Alerts
```http
POST /api/alerts/generate
Content-Type: application/json

{
  "data": [...],
  "forecastResult": { ... }
}
```

#### Get All Alerts
```http
GET /api/alerts?severity=critical&channel=Google%20Ads
```

#### Acknowledge Alert
```http
POST /api/alerts/acknowledge/:id
```

#### Acknowledge All
```http
POST /api/alerts/acknowledge-all
```

#### Get Unread Count
```http
GET /api/alerts/unread-count
```

### Time Machine

#### Recalculate
```http
POST /api/time-machine/recalculate
Content-Type: application/json

{
  "budgets": { "Google Ads": 15000, "Meta Ads": 5000, "Microsoft Ads": 3000 },
  "data": [...]
}
```

#### Get Preset Scenarios
```http
GET /api/time-machine/presets
```

#### Find Optimal
```http
POST /api/time-machine/optimal
Content-Type: application/json

{
  "data": [...],
  "totalBudget": 23000
}
```

### Reports

#### Generate Report
```http
POST /api/reports/generate
Content-Type: application/json

{
  "clientName": "Acme Corp",
  "startDate": "2024-01-01",
  "endDate": "2024-01-31",
  "template": "executive",
  "forecastData": { ... },
  "channelBudgets": { "Google Ads": 10000 },
  "includeSections": { "forecast": true, "channels": true }
}
```

#### Get Templates
```http
GET /api/reports/templates
```

---

## Holidays

### Get Holidays
```http
GET /api/holidays
```

### Get Upcoming Holidays
```http
GET /api/holidays/upcoming
```

### Check Holiday
```http
GET /api/holidays/check/:date
```

---

## Response Format

All endpoints return:
```json
{
  "success": true,
  "data": { ... }
}
```

## Error Format
```json
{
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

## Rate Limits
- Global: 100 requests per 15 minutes
- Forecast generation: 10 requests per minute

## WebSocket Events
- `forecast:progress` - Forecast generation progress
- `forecast:complete` - Forecast generation complete
- `forecast:failed` - Forecast generation failed
