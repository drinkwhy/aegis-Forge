# Stage 1: Builder
FROM golang:1.23-alpine AS builder
WORKDIR /app
COPY go.mod go.sum* ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /assessment-worker ./cmd/worker/

# Stage 2: Runner
FROM alpine:3.20
RUN apk add --no-cache ca-certificates tzdata
WORKDIR /app
COPY --from=builder /assessment-worker .
EXPOSE ${PORT:-8010}
ENV PORT=8010
CMD ["/app/assessment-worker"]
