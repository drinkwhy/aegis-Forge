# Stage 1: Builder
FROM golang:1.25-alpine AS builder
WORKDIR /app

# Copy only the worker module files first for caching
COPY services/assessment-worker/go.mod services/assessment-worker/go.sum* ./
RUN go mod download

# Copy worker source
COPY services/assessment-worker/ ./
RUN CGO_ENABLED=0 GOOS=linux go build -o /assessment-worker ./cmd/worker/

# Stage 2: Runner
FROM alpine:3.20
RUN apk add --no-cache ca-certificates tzdata
WORKDIR /app
COPY --from=builder /assessment-worker .
EXPOSE ${PORT:-8010}
ENV PORT=8010
CMD ["/app/assessment-worker"]
