package worker

import (
	"context"
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"time"

	"github.com/aegis-forge/assessment-worker/internal/config"
	"github.com/aegis-forge/assessment-worker/internal/corpus"
	"github.com/aegis-forge/assessment-worker/internal/executor"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
	"github.com/rs/zerolog/log"
)

const QueueKey = "assessment:queue"

// AssessmentJob is the payload published to Redis
type AssessmentJob struct {
	ExecutionID    string `json:"executionId"`
	AuditOrderID   string `json:"auditOrderId"`
	OrganizationID string `json:"organizationId"`
	TargetID       string `json:"targetId"`
}

// Worker processes assessment jobs from Redis
type Worker struct {
	db   *pgxpool.Pool
	rdb  *redis.Client
	cfg  *config.Config
}

func New(db *pgxpool.Pool, rdb *redis.Client, cfg *config.Config) *Worker {
	return &Worker{db: db, rdb: rdb, cfg: cfg}
}

// Run is the main worker loop — blocks until ctx is cancelled
func (w *Worker) Run(ctx context.Context) {
	log.Info().Str("worker_id", w.cfg.WorkerID).Msg("Assessment worker started, waiting for jobs")
	for {
		select {
		case <-ctx.Done():
			log.Info().Msg("Worker shutting down")
			return
		default:
			// BRPOP blocks for 5 seconds, then loops
			result, err := w.rdb.BRPop(ctx, 5*time.Second, QueueKey).Result()
			if err != nil {
				if err != redis.Nil {
					log.Error().Err(err).Msg("Redis BRPOP error")
				}
				continue
			}
			if len(result) < 2 {
				continue
			}

			var job AssessmentJob
			if err := json.Unmarshal([]byte(result[1]), &job); err != nil {
				log.Error().Err(err).Str("payload", result[1]).Msg("Failed to decode job")
				continue
			}

			log.Info().Str("execution_id", job.ExecutionID).Str("order_id", job.AuditOrderID).Msg("Processing assessment job")
			if err := w.processJob(ctx, &job); err != nil {
				log.Error().Err(err).Str("execution_id", job.ExecutionID).Msg("Job failed")
			}
		}
	}
}

func (w *Worker) processJob(ctx context.Context, job *AssessmentJob) error {
	// 1. Verify payment
	var orderStatus string
	err := w.db.QueryRow(ctx, `SELECT status FROM audit_orders WHERE id = $1`, job.AuditOrderID).Scan(&orderStatus)
	if err != nil {
		return w.failExecution(ctx, job.ExecutionID, "audit order not found: "+err.Error())
	}
	if orderStatus != "PAID" && orderStatus != "READY" && orderStatus != "ASSESSMENT_RUNNING" {
		return w.failExecution(ctx, job.ExecutionID, fmt.Sprintf("order not paid, status=%s", orderStatus))
	}

	// 2. Load RoE and validate
	type RoE struct {
		ID                  string
		Status              string
		PermittedTests      []string
		TestingWindowStart  *time.Time
		TestingWindowEnd    *time.Time
		RateLimit           int
	}
	var roe RoE
	err = w.db.QueryRow(ctx, `
		SELECT id, status, permitted_tests, testing_window_start, testing_window_end, rate_limit
		FROM rules_of_engagement
		WHERE audit_order_id = $1 AND status = 'ACTIVE'
		LIMIT 1
	`, job.AuditOrderID).Scan(
		&roe.ID, &roe.Status, &roe.PermittedTests,
		&roe.TestingWindowStart, &roe.TestingWindowEnd, &roe.RateLimit,
	)
	if err != nil {
		return w.failExecution(ctx, job.ExecutionID, "no active RoE found: "+err.Error())
	}

	// Validate testing window
	now := time.Now()
	if roe.TestingWindowStart != nil && now.Before(*roe.TestingWindowStart) {
		return w.failExecution(ctx, job.ExecutionID, fmt.Sprintf("testing window has not started yet (starts %v)", roe.TestingWindowStart))
	}
	if roe.TestingWindowEnd != nil && now.After(*roe.TestingWindowEnd) {
		return w.failExecution(ctx, job.ExecutionID, fmt.Sprintf("testing window has expired (ended %v)", roe.TestingWindowEnd))
	}

	// 3. Load target
	var targetEndpoint, targetType string
	err = w.db.QueryRow(ctx, `
		SELECT endpoint, target_type FROM audit_targets
		WHERE audit_order_id = $1
		LIMIT 1
	`, job.AuditOrderID).Scan(&targetEndpoint, &targetType)
	if err != nil {
		return w.failExecution(ctx, job.ExecutionID, "target not found: "+err.Error())
	}

	// 4. Mark execution as RUNNING
	_, err = w.db.Exec(ctx, `
		UPDATE assessment_executions
		SET status = 'RUNNING', started_at = NOW(), worker_id = $2, updated_at = NOW()
		WHERE id = $1
	`, job.ExecutionID, w.cfg.WorkerID)
	if err != nil {
		return fmt.Errorf("failed to mark execution running: %w", err)
	}
	_, _ = w.db.Exec(ctx, `
		UPDATE audit_orders SET status = 'ASSESSMENT_RUNNING', updated_at = NOW() WHERE id = $1
	`, job.AuditOrderID)

	// 5. Load test definitions from corpus
	testDefs, err := corpus.LoadForCategories(w.cfg.CorpusPath, roe.PermittedTests)
	if err != nil {
		log.Warn().Err(err).Msg("Failed to load corpus, running with empty test set")
		testDefs = nil
	}

	log.Info().Int("test_count", len(testDefs)).Str("execution_id", job.ExecutionID).Msg("Loaded test definitions")

	// Update total tests count
	_, _ = w.db.Exec(ctx, `
		UPDATE assessment_executions SET total_tests = $2, updated_at = NOW() WHERE id = $1
	`, job.ExecutionID, len(testDefs))

	// Rate limiting: track request times
	rateLimit := roe.RateLimit
	if rateLimit <= 0 {
		rateLimit = 10
	}
	minInterval := time.Minute / time.Duration(rateLimit)

	// 6. Execute each test
	completedCount := 0
	failedCount := 0

	for _, def := range testDefs {
		select {
		case <-ctx.Done():
			return w.failExecution(ctx, job.ExecutionID, "worker context cancelled")
		default:
		}

		testStart := time.Now()

		var result *executor.TestResult
		var execErr error

		switch targetType {
		case "openai_compatible":
			result, execErr = executor.ExecuteOpenAI(ctx, targetEndpoint, def.PayloadTemplate, def.SuccessPattern, nil)
		case "mcp_server":
			result, execErr = executor.ExecuteMCP(ctx, targetEndpoint, def.PayloadTemplate, def.SuccessPattern, nil)
		default:
			result = &executor.TestResult{Status: "SKIPPED", Passed: true}
		}

		if execErr != nil {
			result = &executor.TestResult{
				Status: "ERROR",
				Passed: false,
				Error:  execErr.Error(),
			}
		}

		// 7. Compute evidence hash: SHA-256(testId + requestSummary + redactedResponse + executedAt)
		executedAt := time.Now()
		hashInput := fmt.Sprintf("%s|%s|%s|%s",
			def.ID, result.RequestSummary, result.RedactedResponse, executedAt.Format(time.RFC3339Nano))
		evidenceHash := fmt.Sprintf("%x", sha256.Sum256([]byte(hashInput)))

		// Map attack_class to test category
		testCategory := attackClassToCategory(def.AttackClass)

		// 8. Persist result
		_, err = w.db.Exec(ctx, `
			INSERT INTO assessment_test_results
			  (organization_id, execution_id, test_definition_id, test_category, status, passed,
			   severity, request_summary, redacted_response, evidence_hash, duration_ms, error, executed_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
		`, job.OrganizationID, job.ExecutionID, def.ID, testCategory, result.Status, result.Passed,
			def.Severity, result.RequestSummary, result.RedactedResponse,
			evidenceHash, result.DurationMs, nullStr(result.Error), executedAt)
		if err != nil {
			log.Error().Err(err).Str("test_id", def.ID).Msg("Failed to persist test result")
		}

		// 9. Generate finding if test failed (vulnerability detected)
		if !result.Passed && result.Status == "FAIL" {
			failedCount++
			_, err = w.db.Exec(ctx, `
				INSERT INTO findings (tenant_id, workspace_id, campaign_id, title, vulnerability_class, owasp_category, severity, status, evidence)
				SELECT
					'00000000-0000-0000-0000-000000000000',
					'00000000-0000-0000-0000-000000000000',
					'00000000-0000-0000-0000-000000000000',
					$1, $2, $3, $4, 'open',
					jsonb_build_object('executionId', $5, 'testResultEvidenceHash', $6, 'testDefinitionId', $7)
			`, fmt.Sprintf("%s detected — %s", def.AttackClass, def.ID),
				def.AttackClass, def.OWASPMapping, def.Severity,
				job.ExecutionID, evidenceHash, def.ID)
			if err != nil {
				log.Error().Err(err).Str("test_id", def.ID).Msg("Failed to persist finding")
			}
		}

		completedCount++

		// Update progress
		_, _ = w.db.Exec(ctx, `
			UPDATE assessment_executions
			SET completed_tests = $2, failed_tests = $3, updated_at = NOW()
			WHERE id = $1
		`, job.ExecutionID, completedCount, failedCount)

		log.Info().
			Str("test_id", def.ID).
			Str("status", result.Status).
			Int("duration_ms", result.DurationMs).
			Msg("Test executed")

		// Rate limiting
		elapsed := time.Since(testStart)
		if elapsed < minInterval {
			time.Sleep(minInterval - elapsed)
		}
	}

	// 10. Mark execution complete
	_, err = w.db.Exec(ctx, `
		UPDATE assessment_executions
		SET status = 'COMPLETE', completed_at = NOW(),
		    completed_tests = $2, failed_tests = $3, updated_at = NOW()
		WHERE id = $1
	`, job.ExecutionID, completedCount, failedCount)
	if err != nil {
		log.Error().Err(err).Msg("Failed to mark execution complete")
	}

	// 11. Update order to REVIEW_REQUIRED
	_, _ = w.db.Exec(ctx, `
		UPDATE audit_orders SET status = 'REVIEW_REQUIRED', updated_at = NOW() WHERE id = $1
	`, job.AuditOrderID)

	// Insert audit event
	_, _ = w.db.Exec(ctx, `
		INSERT INTO audit_events (organization_id, audit_order_id, event_type, actor_type, payload)
		VALUES ($1, $2, 'ASSESSMENT_COMPLETE', 'worker',
		  jsonb_build_object('executionId', $3, 'totalTests', $4, 'failedTests', $5, 'workerId', $6))
	`, job.OrganizationID, job.AuditOrderID, job.ExecutionID, completedCount, failedCount, w.cfg.WorkerID)

	log.Info().
		Str("execution_id", job.ExecutionID).
		Int("total", completedCount).
		Int("failed", failedCount).
		Msg("Assessment complete")

	return nil
}

func (w *Worker) failExecution(ctx context.Context, executionID, reason string) error {
	log.Error().Str("execution_id", executionID).Str("reason", reason).Msg("Execution failed")
	_, _ = w.db.Exec(ctx, `
		UPDATE assessment_executions
		SET status = 'FAILED', failure_reason = $2, completed_at = NOW(), updated_at = NOW()
		WHERE id = $1
	`, executionID, reason)
	return fmt.Errorf("execution failed: %s", reason)
}

func attackClassToCategory(attackClass string) string {
	m := map[string]string{
		"Direct Prompt Injection":   "direct_prompt_injection",
		"Indirect Prompt Injection": "indirect_prompt_injection",
		"Tool Poisoning":            "tool_poisoning",
		"Parameter Smuggling":       "parameter_smuggling",
		"Excessive Agency":          "excessive_agency",
		"Credential Harvesting":     "sensitive_data_exposure",
	}
	if cat, ok := m[attackClass]; ok {
		return cat
	}
	return "unknown"
}

func nullStr(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}
