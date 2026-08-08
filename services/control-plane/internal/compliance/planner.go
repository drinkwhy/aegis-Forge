package compliance

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rs/zerolog/log"
)

type AssessmentPlanner struct {
	db *pgxpool.Pool
}

func NewAssessmentPlanner(db *pgxpool.Pool) *AssessmentPlanner {
	return &AssessmentPlanner{db: db}
}

// GeneratePlan maps the active compliance frameworks to required test categories.
func (p *AssessmentPlanner) GeneratePlan(ctx context.Context, auditCaseID string) error {
	log.Info().Str("audit_case_id", auditCaseID).Msg("Generating assessment plan based on compliance profile")

	// 1. Fetch compliance profile
	var applicableFrameworks []string
	err := p.db.QueryRow(ctx, `SELECT applicable_frameworks FROM compliance_profiles WHERE audit_case_id = $1`, auditCaseID).Scan(&applicableFrameworks)
	if err != nil {
		return fmt.Errorf("failed to fetch compliance profile: %w", err)
	}

	if len(applicableFrameworks) == 0 {
		log.Warn().Str("audit_case_id", auditCaseID).Msg("No frameworks applicable, falling back to default tests")
		applicableFrameworks = []string{"default"}
	}

	// 2. Fetch required test categories from framework_controls
	rows, err := p.db.Query(ctx, `
		SELECT unnest(required_test_categories) 
		FROM framework_controls 
		WHERE framework_id = ANY($1)
	`, applicableFrameworks)
	if err != nil {
		return fmt.Errorf("failed to fetch required tests: %w", err)
	}
	defer rows.Close()

	testSet := make(map[string]bool)
	for rows.Next() {
		var cat string
		if err := rows.Scan(&cat); err == nil {
			testSet[cat] = true
		}
	}

	requiredTests := []string{}
	for cat := range testSet {
		requiredTests = append(requiredTests, cat)
	}

	// 3. Persist the assessment_plan
	_, err = p.db.Exec(ctx, `
		INSERT INTO assessment_plans (audit_case_id, required_tests)
		VALUES ($1, $2)
		ON CONFLICT (audit_case_id) DO UPDATE 
		SET required_tests = $2, created_at = NOW()
	`, auditCaseID, requiredTests)
	if err != nil {
		return fmt.Errorf("failed to persist assessment plan: %w", err)
	}

	log.Info().Int("required_tests_count", len(requiredTests)).Msg("Successfully generated assessment plan")
	return nil
}
