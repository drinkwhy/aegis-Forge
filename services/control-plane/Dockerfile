# Stage 1: Builder
# Railway builds from the repo root, so paths are relative to repo root
FROM golang:1.23-alpine AS builder
WORKDIR /app

# Copy only the control-plane module files first for caching
COPY services/control-plane/go.mod services/control-plane/go.sum* ./
RUN go mod download

# Copy control-plane source
COPY services/control-plane/ ./
RUN CGO_ENABLED=0 GOOS=linux go build -o /control-plane ./cmd/api/

# Stage 2: Runner
FROM alpine:3.20
RUN apk add --no-cache ca-certificates tzdata
WORKDIR /app
COPY --from=builder /control-plane .
# Embed migrations
COPY --from=builder /app/internal/database/migrations ./internal/database/migrations
EXPOSE ${PORT:-8080}
ENV PORT=8080
CMD ["/app/control-plane"]
