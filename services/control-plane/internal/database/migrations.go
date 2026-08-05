package database

import (
	"context"
	"embed"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rs/zerolog/log"
)

//go:embed migrations/*.sql
var migrationFiles embed.FS

// RunMigrations applies all migration SQL files in sequence, tracking completion in schema_migrations
func RunMigrations(ctx context.Context, pool *pgxpool.Pool) error {
	// Create schema migrations table to track status
	_, err := pool.Exec(ctx, `
		CREATE TABLE IF NOT EXISTS schema_migrations (
			version VARCHAR(255) PRIMARY KEY
		)
	`)
	if err != nil {
		return fmt.Errorf("failed to check schema_migrations table: %w", err)
	}

	// Self-healing pre-seeding check:
	// If 'tenants' table already exists in public schema, pre-seed 001_initial_schema.sql
	var tenantsExists bool
	_ = pool.QueryRow(ctx, "SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tenants')").Scan(&tenantsExists)
	if tenantsExists {
		_, _ = pool.Exec(ctx, "INSERT INTO schema_migrations (version) VALUES ('001_initial_schema.sql') ON CONFLICT DO NOTHING")
	}

	// If 'subject_snapshots' table already exists in public schema, pre-seed 002_security_passport.sql
	var snapshotsExists bool
	_ = pool.QueryRow(ctx, "SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'subject_snapshots')").Scan(&snapshotsExists)
	if snapshotsExists {
		_, _ = pool.Exec(ctx, "INSERT INTO schema_migrations (version) VALUES ('002_security_passport.sql') ON CONFLICT DO NOTHING")
	}

	// If 'ai_systems' table already exists, pre-seed 003_ai_systems.sql
	var aiSystemsExists bool
	_ = pool.QueryRow(ctx, "SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ai_systems')").Scan(&aiSystemsExists)
	if aiSystemsExists {
		_, _ = pool.Exec(ctx, "INSERT INTO schema_migrations (version) VALUES ('003_ai_systems.sql') ON CONFLICT DO NOTHING")
	}

	files := []string{
		"001_initial_schema.sql",
		"002_security_passport.sql",
		"003_ai_systems.sql",
	}

	for _, file := range files {
		var exists bool
		err = pool.QueryRow(ctx, "SELECT EXISTS(SELECT 1 FROM schema_migrations WHERE version = $1)", file).Scan(&exists)
		if err != nil {
			return fmt.Errorf("failed to query migration status for %s: %w", file, err)
		}

		if exists {
			continue
		}

		log.Info().Msgf("Applying database schema migration: %s", file)
		content, err := migrationFiles.ReadFile("migrations/" + file)
		if err != nil {
			return fmt.Errorf("failed to read embedded migration %s: %w", file, err)
		}

		// Apply migration statements
		_, err = pool.Exec(ctx, string(content))
		if err != nil {
			return fmt.Errorf("failed executing migration %s: %w", file, err)
		}

		// Log success
		_, err = pool.Exec(ctx, "INSERT INTO schema_migrations (version) VALUES ($1)", file)
		if err != nil {
			return fmt.Errorf("failed to log migration version %s: %w", file, err)
		}
		log.Info().Msgf("Migration %s applied successfully", file)
	}

	return nil
}
