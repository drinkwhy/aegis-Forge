package database

import (
	"context"
	"embed"

	"github.com/jackc/pgx/v5/pgxpool"
)

//go:embed migrations/*.sql
var migrationFiles embed.FS

func RunMigrations(ctx context.Context, pool *pgxpool.Pool) error {
	// Simple stub for running migrations
	// In production we would use golang-migrate or similar to apply these properly.
	return nil
}
