FROM node:20-alpine AS base

RUN npm install -g pnpm@9.15.4

WORKDIR /app

FROM base AS deps

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY apps/web/package.json apps/web/package.json
COPY packages/db/package.json packages/db/package.json

RUN pnpm install --no-frozen-lockfile

FROM base AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_Zmx1ZW50LXN3YW4tOTYuY2xlcmsuYWNjb3VudHMuZGV2JA
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

RUN pnpm --filter @aegis/web build

FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ARG PORT=8080
ENV PORT=$PORT

COPY --from=builder /app ./

EXPOSE 8080

CMD ["sh", "-c", "pnpm --filter @aegis/web start"]
