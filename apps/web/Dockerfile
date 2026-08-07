# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app

RUN npm install -g pnpm@9.15.4

# Copy workspace config
COPY package.jso[n] pnpm-workspace.yam[l] pnpm-lock.yam[l] .npmr[c] ./
COPY packages/db/package.jso[n] packages/db/
COPY apps/web/package.jso[n] apps/web/

RUN pnpm install --frozen-lockfile

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY . .

ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_Zmx1ZW50LXN3YW4tOTYuY2xlcmsuYWNjb3VudHMuZGV2JA
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

RUN npm install -g pnpm@9.15.4
RUN pnpm --filter @aegis/web build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ARG PORT=8080
ENV PORT=$PORT
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

USER nextjs

EXPOSE $PORT
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/web/server.js"]
