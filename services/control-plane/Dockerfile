# Stage 1: Builder
FROM golang:1.23-alpine AS builder
WORKDIR /app
COPY go.mod go.sum* ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /control-plane ./cmd/api/

# Stage 2: Runner
FROM alpine:3.20
RUN apk add --no-cache ca-certificates tzdata
WORKDIR /app
COPY --from=builder /control-plane .
# Embed attack corpus and migrations
COPY --from=builder /app/internal/database/migrations ./internal/database/migrations
EXPOSE ${PORT:-8080}
ENV PORT=8080
CMD ["/app/control-plane"]
