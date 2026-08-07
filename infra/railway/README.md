# Railway Deployment Guide

## Services

Deploy the following services on Railway:

### 1. Web (apps/web)
- Dockerfile: `apps/web/Dockerfile`
- Start: `node apps/web/server.js`
- Health: `GET /api/health`
- Port: $PORT

### 2. Control Plane (services/control-plane)
- Dockerfile: `services/control-plane/Dockerfile`
- Health: `GET /health/live`, `GET /health/ready`
- Port: $PORT

### 3. Assessment Worker (services/assessment-worker)
- Dockerfile: `services/assessment-worker/Dockerfile`  
- Health: `GET /health/live`, `GET /health/ready`
- Port: $PORT
- Requires: DATABASE_URL, REDIS_URL, CORPUS_PATH

### 4. PostgreSQL
- Use Railway's managed PostgreSQL
- Share DATABASE_URL reference across all services

### 5. Redis
- Use Railway's managed Redis
- Share REDIS_URL reference across assessment-worker

## Required Environment Variables

### All services:
- DATABASE_URL
- AEGIS_ENV=production

### Web only:
- NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
- CLERK_SECRET_KEY
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
- STRIPE_PRICE_ID
- LAUNCH_ASSESSMENT_PRICE_CENTS
- NEXT_PUBLIC_CONTROL_PLANE_URL (private Railway URL of control-plane)
- CONTROL_PLANE_API_SECRET

### Control Plane only:
- VAULT_ADDR (or use built-in Ed25519 key)
- VAULT_TOKEN

### Assessment Worker only:
- REDIS_URL
- CORPUS_PATH=/app/attack-corpus (if corpus is embedded)

## Private Networking

Services should communicate via Railway's private networking (*.railway.internal).
Do NOT expose the control-plane or worker directly to the public internet.
