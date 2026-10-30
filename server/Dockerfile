# Multi-stage Dockerfile for Node.js Express Backend + React Static Client

# -------------------------------------------------------------
# Stage 1: Build the React Client
# -------------------------------------------------------------
FROM node:20-alpine AS client-builder

WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci

COPY client/ ./
RUN npm run build

# -------------------------------------------------------------
# Stage 2: Production Server
# -------------------------------------------------------------
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production \
    PORT=5000 \
    NLP_SERVICE_URL=http://nlp-service:8000

# Install server dependencies
COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm ci --omit=dev

# Copy server code
COPY server/ ./

# Copy built frontend assets from Stage 1 into client/dist
COPY --from=client-builder /app/client/dist /app/client/dist

# Expose web port
EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

CMD ["npm", "start"]
