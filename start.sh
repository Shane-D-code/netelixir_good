#!/usr/bin/env bash
set -euo pipefail

# ─── Configuration ───────────────────────────────────────────────────────────
BACKEND_DIR="$(dirname "$0")/forecastai-app/backend"
FRONTEND_DIR="$(dirname "$0")/forecastai-app/frontend"
ML_DIR="$(dirname "$0")/forecastai-app/ml-service"
ENV_FILE="$(dirname "$0")/.env"

BACKEND_PORT=3001
FRONTEND_PORT=3000
ML_PORT=8001

# ─── Colors ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# ─── Helpers ─────────────────────────────────────────────────────────────────
log()   { echo -e "${GREEN}[✔]${NC} $*"; }
warn()  { echo -e "${YELLOW}[!]${NC} $*"; }
err()   { echo -e "${RED}[✘]${NC} $*" >&2; }
info()  { echo -e "${CYAN}[i]${NC} $*"; }

cleanup() {
  echo ""
  warn "Shutting down services..."
  for pid in "${PIDS[@]}"; do
    if kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null || true
    fi
  done
  wait 2>/dev/null || true
  log "All services stopped."
  exit 0
}

trap cleanup SIGINT SIGTERM

PIDS=()

# ─── Prerequisite checks ────────────────────────────────────────────────────
check_command() {
  if ! command -v "$1" &>/dev/null; then
    err "'$1' is not installed. Please install it first."
    exit 1
  fi
}

check_command node
check_command npm
check_command python3
check_command pip3

info "Node $(node -v) | npm $(npm -v) | Python $(python3 --version 2>&1 | awk '{print $2}')"

# ─── .env file ──────────────────────────────────────────────────────────────
if [[ ! -f "$ENV_FILE" ]]; then
  warn ".env file not found. Copying from .env.example..."
  cp "$(dirname "$0")/.env.example" "$ENV_FILE"
  log ".env created — edit it to add API keys if needed."
fi

# ─── Install dependencies ───────────────────────────────────────────────────
install_deps() {
  local dir="$1"
  local name="$2"
  if [[ ! -d "$dir/node_modules" ]]; then
    info "Installing $name dependencies..."
    (cd "$dir" && npm install --silent)
    log "$name dependencies installed."
  else
    log "$name dependencies already installed."
  fi
}

install_deps "$BACKEND_DIR"  "Backend"
install_deps "$FRONTEND_DIR" "Frontend"

# Python dependencies
if [[ ! -f "$ML_DIR/.venv/bin/activate" ]]; then
  info "Setting up Python virtual environment for ML service..."
  python3 -m venv "$ML_DIR/.venv"
fi
# shellcheck disable=SC1091
source "$ML_DIR/.venv/bin/activate"

info "Installing Python packages (this may take a minute)..."
if pip install --only-binary=:all: -r "$ML_DIR/requirements.txt"; then
  log "ML service dependencies ready."
else
  err "Failed to install Python dependencies!"
  err "Try manually: cd $ML_DIR && source .venv/bin/activate && pip install -r requirements.txt"
  exit 1
fi

# ─── Ensure data directory ──────────────────────────────────────────────────
mkdir -p "$(dirname "$0")/forecastai-app/data"

# ─── Start services ─────────────────────────────────────────────────────────
start_service() {
  local name="$1"
  local dir="$2"
  local cmd="$3"
  local port="$4"

  info "Starting $name on port $port..."
  (cd "$dir" && eval "$cmd") &
  local pid=$!
  PIDS+=($pid)
  sleep 1
  if kill -0 "$pid" 2>/dev/null; then
    log "$name started (PID $pid)"
  else
    err "$name failed to start!"
  fi
}

start_service "ML Service"   "$ML_DIR"  "uvicorn core.app:app --host 0.0.0.0 --port $ML_PORT --reload" "$ML_PORT"
start_service "Backend"      "$BACKEND_DIR" "npm run dev" "$BACKEND_PORT"
start_service "Frontend"     "$FRONTEND_DIR" "npm run dev" "$FRONTEND_PORT"

# ─── Summary ────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  ForecastAI is running!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "  Frontend   →  http://localhost:${FRONTEND_PORT}"
echo -e "  Backend    →  http://localhost:${BACKEND_PORT}"
echo -e "  ML Service →  http://localhost:${ML_PORT}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "  Press ${YELLOW}Ctrl+C${NC} to stop all services."
echo ""

wait
