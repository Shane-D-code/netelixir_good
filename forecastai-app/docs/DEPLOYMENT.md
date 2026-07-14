# ForecastAI Deployment Guide

## Local Development

### Prerequisites
- Node.js 18+
- Python 3.10+
- npm or yarn

### Setup
1. Clone the repository
2. Install backend dependencies: `cd backend && npm install`
3. Install frontend dependencies: `cd frontend && npm install`
4. Copy `.env.example` to `.env` in backend/
5. Start ML service: `cd ml-service && pip install -r requirements.txt && python app.py`
6. Start backend: `cd backend && npm run dev`
7. Start frontend: `cd frontend && npm run dev`

## Docker Deployment

### docker-compose.yml
The project includes a docker-compose.yml with 3 services:
- ml-service (port 8001)
- backend (port 3001)
- frontend (port 80 -> served by Nginx)

### Build and Run
```bash
docker-compose up --build
```

## Production Deployment

### Vercel (Frontend)
1. Connect GitHub repository
2. Set root directory to `frontend`
3. Build command: `npm run build`
4. Output directory: `dist`

### Railway (Backend)
1. Connect GitHub repository
2. Set root directory to `backend`
3. Add environment variables
4. Deploy

### Streamlit Cloud (ML Service)
Not applicable - use Docker or cloud VM for Python service.

## Environment Variables
See `.env.example` for all required and optional variables.

## Monitoring
- Health check: GET /api/health
- Readiness: GET /api/health/readiness
- Metrics: GET /api/metrics (Prometheus format)
- Swagger docs: GET /api-docs
