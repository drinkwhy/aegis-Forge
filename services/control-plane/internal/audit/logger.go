package audit

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rs/zerolog/log"
)

type AuditLogger struct {
	db *pgxpool.Pool
}

func NewAuditLogger(db *pgxpool.Pool) *AuditLogger {
	return &AuditLogger{db: db}
}

func (l *AuditLogger) Log(ctx context.Context, action, resourceType, resourceID string, metadata map[string]interface{}) {
	// Fire and forget
	go func() {
		// In a real implementation this inserts into audit_log table.
		// Never returns an error to caller (logs internally if audit write fails)
		err := l.insert(context.Background(), action, resourceType, resourceID, metadata)
		if err != nil {
			log.Error().Err(err).Msg("Failed to write audit log")
		}
	}()
}

func (l *AuditLogger) insert(ctx context.Context, action, resourceType, resourceID string, metadata map[string]interface{}) error {
	// Stub implementation
	return nil
}
