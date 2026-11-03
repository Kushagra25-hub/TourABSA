# ==============================================================================
# Production Dockerfile for Hugging Face Spaces (TourABSA)
# Combines: React 19 Frontend + Node.js Express API + Python FastAPI DeBERTa NLP
# ==============================================================================

# -------------------------------------------------------------
# Stage 1: Build React Production Client
# -------------------------------------------------------------
FROM node:20-slim AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# -------------------------------------------------------------
# Stage 2: Unified Production Environment
# -------------------------------------------------------------
FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PORT=7860 \
    NODE_ENV=production \
    NLP_SERVICE_URL=http://127.0.0.1:8000

# Install system dependencies + Node.js 20 runtime
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    gnupg \
    build-essential \
    && mkdir -p /etc/apt/keyrings \
    && curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg \
    && echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list \
    && apt-get update && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

# Set up Hugging Face standard non-root user (UID 1000)
RUN useradd -m -u 1000 user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH
WORKDIR /app

# 1. Install Python NLP service dependencies
COPY nlp_service/requirements.txt ./nlp_service/
RUN pip install --upgrade pip && \
    pip install -r nlp_service/requirements.txt && \
    python -m spacy download en_core_web_sm

# 2. Install Node.js backend server dependencies
COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm ci --omit=dev
WORKDIR /app

# 3. Copy application codebases
COPY nlp_service/ ./nlp_service/
COPY server/ ./server/
COPY data/ ./data/

# 4. Copy pre-built React production client from Stage 1
COPY --from=client-builder /app/client/dist ./client/dist

# 5. Copy startup script and adjust permissions for user 1000
COPY start.sh ./start.sh
RUN chmod +x ./start.sh && \
    chown -R user:user /app /home/user

USER user

EXPOSE 7860

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:7860/api/health || exit 1

CMD ["bash", "/app/start.sh"]
