package runtime

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rs/zerolog/log"
)

type ContinuousAssuranceService struct {
	db *pgxpool.Pool
}

func NewContinuousAssuranceService(db *pgxpool.Pool) *ContinuousAssuranceService {
	return &ContinuousAssuranceService{db: db}
}

// ProcessRuntimeEvent handles telemetry from AegisAgent and checks for configuration drift or high-risk actions.
func (s *ContinuousAssuranceService) ProcessRuntimeEvent(ctx context.Context, eventID string) error {
	log.Info().Str("event_id", eventID).Msg("Processing runtime event for continuous assurance")

	// 1. Fetch the event
	var assetID, eventType, action, passportStatus string
	var passportID string
	
	err := s.db.QueryRow(ctx, `
		SELECT e.asset_id, e.event_type, e.action, p.passport_id, p.status
		FROM runtime_events e
		JOIN security_passports p ON e.asset_id = p.asset_id
		WHERE e.id = $1
		LIMIT 1
	`, eventID).Scan(&assetID, &eventType, &action, &passportID, &passportStatus)
	
	if err != nil {
		// No passport or event found.
		return nil
	}

	// 2. Detect configuration drift or anomalies
	driftDetected := false
	reason := ""

	if eventType == "model.changed" {
		driftDetected = true
		reason = "Core model version drift detected"
	} else if eventType == "connector.changed" {
		driftDetected = true
		reason = "New tool or connector added"
	} else if eventType == "behavior.anomaly" {
		driftDetected = true
		reason = "Significant behavioral anomaly detected"
	}

	// 3. React to drift
	if driftDetected && passportStatus != "NEEDS_REVIEW" {
		log.Warn().Str("passport_id", passportID).Str("reason", reason).Msg("Drift detected. Transitioning passport to NEEDS_REVIEW.")

		// Suspend the passport
		_, err := s.db.Exec(ctx, `
			UPDATE security_passports 
			SET status = 'NEEDS_REVIEW' 
			WHERE passport_id = $1
		`, passportID)
		if err != nil {
			return fmt.Errorf("failed to update passport status: %w", err)
		}

		// Insert status event
		_, err = s.db.Exec(ctx, `
			INSERT INTO passport_status_events (passport_id, sequence, status, reason, transitioned_by)
			SELECT $1, COALESCE(MAX(sequence), 0) + 1, 'NEEDS_REVIEW', $2, 'AegisAgent'
			FROM passport_status_events WHERE passport_id = $1
		`, passportID, reason)
		
		if err != nil {
			return fmt.Errorf("failed to insert passport status event: %w", err)
		}
		
		// 4. Trigger automated targeted retesting (mocked orchestration trigger)
		log.Info().Str("asset_id", assetID).Msg("Queuing targeted re-assessment based on detected drift.")
	}

	return nil
}
