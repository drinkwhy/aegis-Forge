# ── Stage 1: Base ──────────────────────────────────────────────
FROM node:20-alpine AS base

RUN npm install -g pnpm@9.15.4

WORKDIR /app

# ── Stage 2: Dependencies ─────────────────────────────────────
FROM base AS deps

# Copy workspace-level files needed for pnpm install
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./

# Copy package.json for each workspace member
COPY apps/web/package.json apps/web/package.json
COPY packages/db/package.json packages/db/package.json

RUN pnpm install --no-frozen-lockfile

# ── Stage 3: Builder ──────────────────────────────────────────
FROM base AS builder

WORKDIR /app

# Copy all installed deps from the deps stage (root + workspace node_modules)
COPY --from=deps /app ./

# Copy source code (node_modules excluded by .dockerignore)
COPY apps/web/ apps/web/
COPY packages/db/ packages/db/

# Build-time env vars
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

RUN pnpm --filter @aegis/web build

# ── Stage 4: Runner ───────────────────────────────────────────
FROM base AS runner

# standalone output preserves the monorepo directory structure,
# so server.js lives at apps/web/server.js inside the standalone dir
WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=8080

COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

EXPOSE 8080

CMD ["node", "apps/web/server.js"]
