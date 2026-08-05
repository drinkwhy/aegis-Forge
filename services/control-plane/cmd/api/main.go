package main

import (
	"context"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/aegis-forge/control-plane/internal/config"
	"github.com/aegis-forge/control-plane/internal/database"
	"github.com/aegis-forge/control-plane/internal/server"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
)

func main() {
	// Initialize zerolog with JSON output
	zerolog.TimeFieldFormat = zerolog.TimeFormatUnix
	log.Logger = log.Output(os.Stdout)

	cfg := config.Load()

	// Initialize database pool
	dbCtx, dbCancel := context.WithTimeout(context.Background(), 10*time.Second)
	dbPool, err := database.NewPool(dbCtx, cfg.DatabaseURL)
	dbCancel()
	if err != nil {
		log.Warn().Err(err).Msg("Failed to connect to database; check credentials or status")
	} else {
		defer dbPool.Close()
		log.Info().Msg("PostgreSQL database connection pool established")
		if err := database.RunMigrations(context.Background(), dbPool); err != nil {
			log.Warn().Err(err).Msg("Failed to run database migrations")
		} else {
			log.Info().Msg("Database migrations applied successfully")
		}
	}

	srv := server.New(cfg, dbPool)

	// Execute Vault transit secrets engine and key bootstrapping
	if err := database.BootstrapVault(cfg.VaultAddr, cfg.VaultToken); err != nil {
		log.Warn().Err(err).Msg("Failed to bootstrap Vault transit secrets engine")
	}

	// Bootstrap database tables with initial WealthFront organizations data if empty
	if dbPool != nil {
		if err := srv.PassportService().BootstrapMockData(context.Background()); err != nil {
			log.Warn().Err(err).Msg("Failed to bootstrap database mock structures")
		}
	}

	httpServer := &http.Server{
		Addr:    ":" + cfg.Port,
		Handler: srv.Router(),
	}

	go func() {
		log.Info().Str("port", cfg.Port).Msg("Starting control-plane API server")
		if err := httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal().Err(err).Msg("HTTP server failed")
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Info().Msg("Shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := httpServer.Shutdown(ctx); err != nil {
		log.Fatal().Err(err).Msg("Server forced to shutdown")
	}

	log.Info().Msg("Server exiting")
}
