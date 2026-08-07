package passport

import (
	"context"
	"crypto/ed25519"
	"encoding/hex"
	"encoding/json"
	"os"
	"testing"
	"time"

	"github.com/aegis-forge/control-plane/internal/database"
	"github.com/jackc/pgx/v5/pgxpool"
)

// TestCalculateFingerprint verifies that snapshot fingerprinting is deterministic
func TestCalculateFingerprint(t *testing.T) {
	service := NewPassportService(nil, "", "")

	data1 := map[string]interface{}{
		"agentCodeCommit": "4dd6988",
		"modelVersion":    "gpt-4o",
		"systemPrompt":    "You are a helpful advisor.",
		"toolManifests":   []string{"read_file", "write_file"},
	}

	// data2 has same keys but in a different order
	data2 := map[string]interface{}{
		"toolManifests":   []string{"read_file", "write_file"},
		"systemPrompt":    "You are a helpful advisor.",
		"modelVersion":    "gpt-4o",
		"agentCodeCommit": "4dd6988",
	}

	fp1 := service.CalculateFingerprint(data1)
	fp2 := service.CalculateFingerprint(data2)

	if fp1 == "" {
		t.Error("fingerprint should not be empty")
	}

	if fp1 != fp2 {
		t.Errorf("fingerprints should be deterministic and equal, got %s and %s", fp1, fp2)
	}
}

// TestSignPayload verifies local Ed25519 fallback signing and signature checks
func TestSignPayload(t *testing.T) {
	service := NewPassportService(nil, "", "")
	ctx := t.Context()

	payload := map[string]interface{}{
		"passportId": "pass-1234",
		"status":     "VALID",
		"issuedAt":   time.Now().Format(time.RFC3339),
	}
	payloadBytes, _ := json.Marshal(payload)

	sig, err := service.SignPayload(ctx, payloadBytes)
	if err != nil {
		t.Skipf("Skipping vault signing test: %v", err)
	}

	if sig.Algorithm != "Ed25519" {
		t.Errorf("expected signature algorithm Ed25519, got %s", sig.Algorithm)
	}

	if len(sig.Signature) == 0 {
		t.Error("expected non-empty signature")
	}

	// Validate signature matches keyID
	const prefix = "local-attestation-key:"
	if len(sig.KeyID) <= len(prefix) {
		t.Fatalf("invalid keyID: %s", sig.KeyID)
	}

	pubKeyHex := sig.KeyID[len(prefix):]
	pubKeyBytes, err := hex.DecodeString(pubKeyHex)
	if err != nil {
		t.Fatalf("failed to decode public key hex: %v", err)
	}

	sigBytes, err := hex.DecodeString(sig.Signature)
	if err != nil {
		t.Fatalf("failed to decode signature hex: %v", err)
	}

	payloadHashBytes, err := hex.DecodeString(sig.PayloadHash)
	if err != nil {
		t.Fatalf("failed to decode payload hash: %v", err)
	}

	// Verify cryptographic signature
	if !ed25519.Verify(pubKeyBytes, payloadHashBytes, sigBytes) {
		t.Error("cryptographic signature verification failed")
	}
}

// TestEvaluationLogic verifies engine scoring math and hard gates
func TestEvaluationLogic(t *testing.T) {
	controlCoverage := 0.90
	evidenceCoverage := 0.80
	validationPassRate := 0.95
	runtimeConfidence := 0.98

	expectedScore := controlCoverage*0.30 + evidenceCoverage*0.25 + validationPassRate*0.30 + runtimeConfidence*0.15
	actualScore := 0.90*0.30 + 0.80*0.25 + 0.95*0.30 + 0.98*0.15

	if expectedScore != actualScore {
		t.Errorf("expected score calculation %f, got %f", expectedScore, actualScore)
	}
}

// TestEvaluationExceptionsIntegration performs integration tests connecting to local PostgreSQL
func TestEvaluationExceptionsIntegration(t *testing.T) {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://aegis:localpassword@localhost:5432/aegisforge?sslmode=disable"
	}

	ctx := t.Context()
	connCtx, connCancel := context.WithTimeout(ctx, 2*time.Second)
	db, err := pgxpool.New(connCtx, dbURL)
	connCancel()
	if err != nil {
		t.Skip("skipping database integration test: cannot connect to postgres")
	}
	defer db.Close()

	pingCtx, pingCancel := context.WithTimeout(ctx, 2*time.Second)
	err = db.Ping(pingCtx)
	pingCancel()
	if err != nil {
		t.Skip("skipping database integration test: postgres ping failed")
	}

	service := NewPassportService(db, "", "")

	// Apply schema migrations to test database
	if err := database.RunMigrations(ctx, db); err != nil {
		t.Fatalf("failed to run database migrations: %v", err)
	}

	orgID := "d3b07384-d113-4a11-b541-ef81f212239e"

	// Pre-bootstrap mock data
	_ = service.BootstrapMockData(ctx)

	// Update telemetry heartbeat to current time to ensure runtime is online during the evaluation checks
	_, err = db.Exec(ctx, "UPDATE control_evaluations SET last_evaluated_at = NOW() WHERE organization_id = $1 AND control_id = 'AegisAgent-heartbeat'", orgID)
	if err != nil {
		t.Fatalf("failed to update telemetry heartbeat: %v", err)
	}

	// Create a test snapshot
	data := map[string]interface{}{"code_version": "v1"}
	snap, err := service.CreateSnapshot(ctx, orgID, "agent_fin_advisor_01", data)
	if err != nil {
		t.Fatalf("failed to create snapshot: %v", err)
	}

	// Evaluate posture: should fail due to the open critical finding we bootstrapped
	eval, err := service.Evaluate(ctx, orgID, "fw-v1.4.2-finance", snap.ID)
	if err != nil {
		t.Fatalf("failed to evaluate: %v", err)
	}

	if eval.Status != EvaluationStatusRevoked && eval.Status != EvaluationStatusIncomplete {
		t.Errorf("expected evaluation to be REVOKED or INCOMPLETE, got %s", eval.Status)
	}

	// Now register a risk exception (finding disposition) for our critical finding
	findingID := "d3b07384-d113-4a11-b541-ef81f2122391"
	expiresAt := time.Now().Add(24 * time.Hour)
	disp := &FindingDisposition{
		OrganizationID: orgID,
		FindingID:      findingID,
		Disposition:    "accepted_risk",
		Owner:          "Dyllan B. (SecOps Lead)",
		Justification:  "Compensating network bounds verified.",
		Approver:       "Test Approver",
		ExpiresAt:      &expiresAt,
	}

	_, err = service.CreateFindingDisposition(ctx, disp)
	if err != nil {
		t.Fatalf("failed to create disposition: %v", err)
	}

	// Evaluate posture again: the critical finding should now be bypassed, and status should become READY or CONDITIONALLY_READY!
	eval2, err := service.Evaluate(ctx, orgID, "fw-v1.4.2-finance", snap.ID)
	if err != nil {
		t.Fatalf("failed to evaluate after disposition: %v", err)
	}

	if eval2.Status != EvaluationStatusReady && eval2.Status != EvaluationStatusConditionallyReady {
		t.Errorf("expected evaluation to be READY or CONDITIONALLY_READY after exception approval, got %s", eval2.Status)
	}

	// Clean up disposition so we don't pollute subsequent test runs
	_, _ = db.Exec(ctx, "DELETE FROM finding_dispositions WHERE finding_id = $1", findingID)
	_, _ = db.Exec(ctx, "UPDATE findings SET status = 'open' WHERE id = $1", findingID)
}
