#!/usr/bin/env bash
set -euo pipefail

DATA_DIR="${1:-./data}"
MODEL_PATH="${2:-./pickle/model.pkl}"
OUTPUT_PATH="${3:-./output/predictions.csv}"
FORECAST_DAYS="${4:-60}"

echo "ForecastAI - Forecast Pipeline"
echo "=============================="
echo "Data dir:   $DATA_DIR"
echo "Model:      $MODEL_PATH"
echo "Output:     $OUTPUT_PATH"
echo "Horizon:    $FORECAST_DAYS days"
echo ""

mkdir -p "$(dirname "$OUTPUT_PATH")"

if [ -d "venv" ]; then
    source venv/bin/activate
fi

pip3 install -r requirements.txt --quiet 2>/dev/null

echo "[1/2] Generating features..."
python3 src/generate_features.py \
    --data-dir "$DATA_DIR" \
    --output features.parquet

echo ""
echo "[2/2] Running predictions..."
python3 src/predict.py \
    --features features.parquet \
    --model "$MODEL_PATH" \
    --output "$OUTPUT_PATH" \
    --forecast-days "$FORECAST_DAYS"

rm -f features.parquet

echo ""
echo "Done! Predictions written to $OUTPUT_PATH"
