#!/bin/bash
set -e

echo "=========================================================="
echo " Starting TourABSA Production Container on Hugging Face   "
echo "=========================================================="

# Export standard Hugging Face port if unset
export PORT=${PORT:-7860}
export NLP_SERVICE_URL="http://127.0.0.1:8000"
export NODE_ENV="production"

# 1. Start Python FastAPI DeBERTa NLP Service in the background
echo "[1/2] Launching Python DeBERTa-v3 NLP Service on 127.0.0.1:8000..."
cd /app/nlp_service
python -m uvicorn app:app --host 127.0.0.1 --port 8000 &

# Wait for NLP service to initialize
echo "Waiting for NLP service health check..."
for i in {1..30}; do
  if curl -s http://127.0.0.1:8000/health > /dev/null 2>&1; then
    echo "✓ DeBERTa NLP Service is ONLINE and healthy!"
    break
  fi
  sleep 2
done

# 2. Start Node.js Web Server & Frontend on port 7860 (Hugging Face default)
echo "[2/2] Starting Node.js Web Server on port ${PORT}..."
cd /app/server
exec node src/index.js

