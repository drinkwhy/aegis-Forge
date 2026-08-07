package main

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/aegis-forge/assessment-worker/internal/config"
	"github.com/aegis-forge/assessment-worker/internal/database"
	"github.com/aegis-forge/assessment-worker/internal/worker"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
)

func main() {
	zerolog.TimeFieldFormat = zerolog.TimeFormatUnix
	log.Logger = log.Output(os.Stdout)

	cfg := config.Load()

	// Connect to Postgres
	dbCtx, dbCancel := context.WithTimeout(context.Background(), 10*time.Second)
	dbPool, err := database.NewPool(dbCtx, cfg.DatabaseURL)
	dbCancel()
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to connect to database")
	}
	defer dbPool.Close()
	log.Info().Msg("Database connected")

	// Connect to Redis
	rdb, err := database.NewRedis(cfg.RedisURL)
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to connect to Redis")
	}
	log.Info().Msg("Redis connected")

	// Create worker
	w := worker.New(dbPool, rdb, cfg)

	// Start health server
	mux := http.NewServeMux()
	mux.HandleFunc("/health/live", func(resp http.ResponseWriter, r *http.Request) {
		resp.Header().Set("Content-Type", "application/json")
		json.NewEncoder(resp).Encode(map[string]string{"status": "alive"})
	})
	mux.HandleFunc("/health/ready", func(resp http.ResponseWriter, r *http.Request) {
		if err := dbPool.Ping(r.Context()); err != nil {
			resp.Header().Set("Content-Type", "application/json")
			resp.WriteHeader(http.StatusServiceUnavailable)
			json.NewEncoder(resp).Encode(map[string]string{"status": "not ready", "error": err.Error()})
			return
		}
		resp.Header().Set("Content-Type", "application/json")
		json.NewEncoder(resp).Encode(map[string]string{"status": "ready"})
	})

	healthServer := &http.Server{
		Addr:    fmt.Sprintf("0.0.0.0:%s", cfg.Port),
		Handler: mux,
	}
	go func() {
		log.Info().Str("port", cfg.Port).Msg("Health server starting")
		if err := healthServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Error().Err(err).Msg("Health server error")
		}
	}()

	// Start worker loop
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	go w.Run(ctx)

	<-quit
	log.Info().Msg("Shutting down assessment worker...")
	cancel()
	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer shutdownCancel()
	healthServer.Shutdown(shutdownCtx)
}
