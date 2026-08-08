package runtime

import (
	"context"
	"fmt"
	"encoding/json"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rs/zerolog/log"
)

type ControlGenerator struct {
	db *pgxpool.Pool
}

func NewControlGenerator(db *pgxpool.Pool) *ControlGenerator {
	return &ControlGenerator{db: db}
}

// GenerateControl creates a recommended AegisAgent policy template based on a failed security finding.
func (g *ControlGenerator) GenerateControl(ctx context.Context, findingID string) error {
	log.Info().Str("finding_id", findingID).Msg("Generating recommended runtime control for finding")

	// 1. Fetch finding details
	var auditCaseID, title, vulnerabilityClass string
	err := g.db.QueryRow(ctx, `
		SELECT audit_case_id, title, vulnerability_class 
		FROM findings 
		WHERE id = $1
	`, findingID).Scan(&auditCaseID, &title, &vulnerabilityClass)
	
	if err != nil {
		return fmt.Errorf("failed to fetch finding: %w", err)
	}

	// 2. Generate policy template based on vulnerability class
	// In reality, this might use an LLM or a lookup table. We'll mock the logic.
	
	controlType := "TOOL_RESTRICTION"
	reason := fmt.Sprintf("Mitigate %s by restricting tool execution.", vulnerabilityClass)
	expectedProtection := "Prevents unauthorized operations without human approval."
	
	policyTemplate := map[string]interface{}{
		"action": "REQUIRE_APPROVAL",
		"target_tools": []string{"database-query", "shell-execution"},
		"allowed_operations": []string{"SELECT", "READ"},
	}
	
	policyJSON, _ := json.Marshal(policyTemplate)

	// 3. Persist recommendation
	_, err = g.db.Exec(ctx, `
		INSERT INTO control_recommendations (finding_id, audit_case_id, control_type, policy_template, reason, expected_protection, generated_by)
		VALUES ($1, $2, $3, $4, $5, $6, 'AegisControlGenerator')
	`, findingID, auditCaseID, controlType, policyJSON, reason, expectedProtection)
	
	if err != nil {
		return fmt.Errorf("failed to save control recommendation: %w", err)
	}

	log.Info().Str("finding_id", findingID).Msg("Successfully generated runtime control recommendation")
	return nil
}
