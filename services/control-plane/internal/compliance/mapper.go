package compliance

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rs/zerolog/log"
)

type ControlEvaluationEngine struct {
	db *pgxpool.Pool
}

func NewControlEvaluationEngine(db *pgxpool.Pool) *ControlEvaluationEngine {
	return &ControlEvaluationEngine{db: db}
}

// Evaluate maps security findings to compliance controls and marks them as failed.
func (e *ControlEvaluationEngine) Evaluate(ctx context.Context, auditCaseID string) error {
	log.Info().Str("audit_case_id", auditCaseID).Msg("Evaluating compliance controls against security findings")

	// 1. Get all findings for this audit case
	rows, err := e.db.Query(ctx, `SELECT id, vulnerability_class FROM findings WHERE audit_case_id = $1`, auditCaseID)
	if err != nil {
		return fmt.Errorf("failed to fetch findings: %w", err)
	}
	defer rows.Close()

	type Finding struct {
		ID    string
		Class string
	}
	var findings []Finding
	for rows.Next() {
		var f Finding
		if err := rows.Scan(&f.ID, &f.Class); err == nil {
			findings = append(findings, f)
		}
	}

	if len(findings) == 0 {
		log.Info().Msg("No findings to map to compliance controls")
		return nil
	}

	// 2. Map findings to controls
	for _, f := range findings {
		// Example mapping: prompt injection -> access control failures in iso27001
		// In a real system, framework_controls would have a mapping relation.
		// For now, we update control_evaluations directly based on test_categories matching finding vulnerability_class.
		
		_, err := e.db.Exec(ctx, `
			UPDATE control_evaluations
			SET status = 'FAIL',
			    finding_ids = array_append(finding_ids, $1),
			    explanation = 'Control failed due to security finding: ' || $2,
			    last_evaluated_at = NOW()
			WHERE audit_case_id = $3
			  AND control_id IN (
				  SELECT c.control_code
				  FROM framework_controls c
				  WHERE $2 = ANY(c.required_test_categories)
			  )
		`, f.ID, f.Class, auditCaseID)
		
		if err != nil {
			log.Error().Err(err).Str("finding_id", f.ID).Msg("Failed to update control evaluation")
		}
	}

	return nil
}

// MapEvidence takes an evidence artifact and maps it across all applicable compliance frameworks.
// This ensures evidence is reused (e.g., one approval satisfies NIST, ISO, and SOC2).
func (e *ControlEvaluationEngine) MapEvidence(ctx context.Context, auditCaseID, evidenceID string) error {
	log.Info().Str("evidence_id", evidenceID).Msg("Mapping single evidence artifact across multiple frameworks")

	// 1. Fetch the evidence classification/type
	var evidenceType, classification string
	err := e.db.QueryRow(ctx, `SELECT evidence_type, classification FROM evidence_artifacts WHERE id = $1`, evidenceID).Scan(&evidenceType, &classification)
	if err != nil {
		return fmt.Errorf("failed to fetch evidence artifact: %w", err)
	}

	// 2. Identify controls across ALL frameworks that require this evidence type
	// If it matches, we mark the control evaluation as 'PASS' with 'AUTOMATIC_VERIFIED' confidence if it's high-integrity evidence
	confidence := "MANUAL_REQUIRED"
	if classification == "SECURITY_EVIDENCE" || classification == "AUTHENTICATION_DATA" {
		confidence = "AUTOMATIC_VERIFIED"
	}

	_, err = e.db.Exec(ctx, `
		UPDATE control_evaluations
		SET status = CASE WHEN $3 = 'AUTOMATIC_VERIFIED' THEN 'PASS' ELSE 'NEEDS_REVIEW' END,
		    evidence_ids = array_append(evidence_ids, $1),
		    confidence = 1.0,
		    explanation = 'Satisfied by automated evidence mapping: ' || $4,
		    reviewer_status = $3,
		    last_evaluated_at = NOW()
		WHERE audit_case_id = $2
		  AND control_id IN (
			  SELECT c.control_code
			  FROM framework_controls c
			  WHERE $4 = ANY(c.required_evidence_types)
		  )
	`, evidenceID, auditCaseID, confidence, evidenceType)
	
	if err != nil {
		return fmt.Errorf("failed to map evidence to controls: %w", err)
	}

	return nil
}
