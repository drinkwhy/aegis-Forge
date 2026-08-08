# ── Stage 1: Base ──────────────────────────────────────────────
FROM node:20-alpine AS base

RUN npm install -g pnpm@9.15.4

WORKDIR /app

# ── Stage 2: Builder ──────────────────────────────────────────
FROM base AS builder

WORKDIR /app

# Copy entire repo into builder (node_modules excluded by .dockerignore)
COPY . .

# Install all workspace dependencies
RUN pnpm install --no-frozen-lockfile

# Build-time env vars
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_Zmx1ZW50LXN3YW4tOTYuY2xlcmsuYWNjb3VudHMuZGV2JA
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

# Build web app
RUN pnpm --filter @aegis/web build

# ── Stage 3: Runner ───────────────────────────────────────────
FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=8080

COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

EXPOSE 8080

CMD ["node", "apps/web/server.js"]
