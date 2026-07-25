FROM golang:1.23-alpine AS builder

WORKDIR /app

# Copy the monorepo root go.work and go.mod files
# In a real monorepo build, context would be root, so paths would be relative to root.
# We'll just build the control plane here.
COPY . .

WORKDIR /app/services/control-plane
RUN go mod download

# Build the binary
RUN CGO_ENABLED=0 GOOS=linux go build -o /app/control-plane-api ./cmd/api

FROM gcr.io/distroless/static:nonroot

WORKDIR /
COPY --from=builder /app/control-plane-api /control-plane-api

USER 65532:65532

ENTRYPOINT ["/control-plane-api"]
