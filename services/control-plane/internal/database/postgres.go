package database

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
)

// NewPool creates a new pgxpool
func NewPool(ctx context.Context, databaseURL string) (*pgxpool.Pool, error) {
	config, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		return nil, err
	}

	config.MinConns = 2
	config.MaxConns = 20

	// We would add a BeforeQuery hook here for RLS in a real implementation
	// config.ConnConfig.Tracer = ...

	pool, err := pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		return nil, err
	}

	if err := pool.Ping(ctx); err != nil {
		return nil, err
	}

	return pool, nil
}
