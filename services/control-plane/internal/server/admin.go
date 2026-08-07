package server

import (
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"net/http"
	"sort"
	"strings"
	"time"

	"github.com/aegis-forge/control-plane/internal/passport"
	"github.com/google/uuid"
)

type issuePassportRequest struct {
	AuditOrderID   string `json:"auditOrderId"`
	OrganizationID string `json:"organizationId"`
	ReviewerUserID string `json:"reviewerUserId"`
	AssetName      string `json:"assetName"`
	ExecutionID    string `json:"executionId"`
}

// handleAdminIssuePassport issues a cryptographically-signed passport for a completed audit order
func (s *Server) handleAdminIssuePassport(w http.ResponseWriter, r *http.Request) {
	// Verify internal API secret
	apiSecret := s.cfg.APISecret
	if apiSecret != "" {
		reqSecret := r.Header.Get("X-Api-Secret")
		if reqSecret != apiSecret {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusUnauthorized)
			json.NewEncoder(w).Encode(map[string]string{"error": "invalid API secret"})
			return
		}
	}

	var req issuePassportRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "invalid request body"})
		return
	}

	if req.AuditOrderID == "" || req.OrganizationID == "" || req.ReviewerUserID == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "auditOrderId, organizationId, and reviewerUserId are required"})
		return
	}

	ctx := r.Context()

	// 1. Verify order exists, is in correct status, and has no passport yet
	var orderStatus string
	var currentPassportID *string
	err := s.db.QueryRow(ctx, `
		SELECT status, passport_id FROM audit_orders WHERE id = $1 AND organization_id = $2
	`, req.AuditOrderID, req.OrganizationID).Scan(&orderStatus, &currentPassportID)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{"error": "audit order not found"})
		return
	}

	if currentPassportID != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusConflict)
		json.NewEncoder(w).Encode(map[string]string{"error": "passport already issued for this order", "passportId": *currentPassportID})
		return
	}

	if orderStatus != "COMPLETED" && orderStatus != "REVIEW_REQUIRED" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnprocessableEntity)
		json.NewEncoder(w).Encode(map[string]string{"error": fmt.Sprintf("order status %s does not allow passport issuance", orderStatus)})
		return
	}

	// 2. Collect REAL test result summary from assessment_test_results
	testTotal := 0
	testPassed := 0
	testFailed := 0
	criticalFailed := 0
	highFailed := 0
	var evidenceHashes []string
	categorySet := make(map[string]bool)

	if req.ExecutionID != "" {
		rows, err := s.db.Query(ctx, `
			SELECT passed, evidence_hash, severity, test_category FROM assessment_test_results
			WHERE execution_id = $1
			ORDER BY executed_at ASC
		`, req.ExecutionID)
		if err == nil {
			defer rows.Close()
			for rows.Next() {
				var passed bool
				var evidenceHash *string
				var severity, category string
				if err := rows.Scan(&passed, &evidenceHash, &severity, &category); err == nil {
					testTotal++
					categorySet[category] = true
					if passed {
						testPassed++
					} else {
						testFailed++
						if severity == "CRITICAL" {
							criticalFailed++
						} else if severity == "HIGH" {
							highFailed++
						}
					}
					if evidenceHash != nil && *evidenceHash != "" {
						evidenceHashes = append(evidenceHashes, *evidenceHash)
					}
				}
			}
		}
	}

	// ── MINIMUM ISSUANCE BAR ─────────────────────────────────────────────────
	// Refuse to issue a passport if the assessment doesn't meet security thresholds.
	if testTotal == 0 {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnprocessableEntity)
		json.NewEncoder(w).Encode(map[string]string{"error": "Cannot issue passport: no test results found. Run the assessment first."})
		return
	}

	if criticalFailed > 0 {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnprocessableEntity)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"error":              fmt.Sprintf("Cannot issue passport: %d CRITICAL severity test(s) failed. Remediate critical vulnerabilities before passport issuance.", criticalFailed),
			"criticalFailures":   criticalFailed,
			"remediationRequired": true,
		})
		return
	}

	failRate := float64(testFailed) / float64(testTotal)
	if failRate > 0.25 {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnprocessableEntity)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"error":              fmt.Sprintf("Cannot issue passport: %.0f%% of tests failed (threshold: 25%%). Remediate findings before passport issuance.", failRate*100),
			"failedTests":        testFailed,
			"totalTests":         testTotal,
			"remediationRequired": true,
		})
		return
	}

	// ── Compute real evidence manifest hash (Merkle root) ─────────────────────
	sort.Strings(evidenceHashes)
	manifestInput := ""
	for _, h := range evidenceHashes {
		manifestInput += h
	}
	manifestHash := fmt.Sprintf("%x", sha256.Sum256([]byte(manifestInput)))

	// 3. Load the target system info for the passport subject
	var assetName string
	if req.AssetName != "" {
		assetName = req.AssetName
	} else {
		assetName = "AI System"
	}

	var targetEndpoint string
	_ = s.db.QueryRow(ctx, `
		SELECT endpoint FROM audit_targets WHERE audit_order_id = $1 LIMIT 1
	`, req.AuditOrderID).Scan(&targetEndpoint)

	// 4. Build passport subject snapshot with real data
	subjectID := uuid.New().String()
	snapshotID := uuid.New().String()
	capturedAt := time.Now()

	categories := make([]string, 0, len(categorySet))
	for cat := range categorySet {
		categories = append(categories, cat)
	}
	sort.Strings(categories)

	// Create subject snapshot with real assessment data
	_, err = s.db.Exec(ctx, `
		INSERT INTO subject_snapshots
		  (id, organization_id, subject_type, subject_id, subject_name, subject_version,
		   deployment_environment, snapshot_data, captured_at, schema_version)
		VALUES ($1, $2, 'AI_SYSTEM', $3, $4, '1.0', 'production',
		  jsonb_build_object(
		    'auditOrderId', $5,
		    'executionId', $6,
		    'testTotal', $7,
		    'testPassed', $8,
		    'testFailed', $9,
		    'criticalFailed', $10,
		    'highFailed', $11,
		    'endpoint', $12,
		    'testCategories', $13::jsonb,
		    'evidenceManifestHash', $14
		  ), $15, '1.0')
	`, snapshotID, req.OrganizationID, subjectID, assetName,
		req.AuditOrderID, req.ExecutionID, testTotal, testPassed, testFailed,
		criticalFailed, highFailed, targetEndpoint,
		fmt.Sprintf(`["%s"]`, join(categories, `","`)), manifestHash, capturedAt)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "failed to create subject snapshot: " + err.Error()})
		return
	}

	// 5. Build assurance evaluation with real metrics
	passRate := 0.0
	if testTotal > 0 {
		passRate = float64(testPassed) / float64(testTotal) * 100.0
	}

	// Determine evaluation status based on actual findings
	evalStatus := passport.EvaluationStatusReady
	if highFailed > 0 {
		evalStatus = passport.EvaluationStatusConditionallyReady
	}

	// Confidence based on evidence coverage
	confidence := float64(len(evidenceHashes)) / float64(max(testTotal, 1))
	if confidence > 1.0 {
		confidence = 1.0
	}

	evalID := uuid.New().String()
	_, err = s.db.Exec(ctx, `
		INSERT INTO assurance_evaluations (
			id, organization_id, framework_version_id, subject_snapshot_id, evaluated_at, engine_version,
			status, overall_score, confidence, control_coverage, evidence_coverage, validation_pass_rate,
			critical_finding_count, high_finding_count, unmet_requirements, accepted_exceptions,
			revocation_reasons, evidence_manifest_hash, subject_fingerprint
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
	`,
		evalID, req.OrganizationID, "OWASP-LLM-TOP10-v1.0", snapshotID, capturedAt, "aegis-sentinel-1.0",
		evalStatus, passRate, confidence, passRate/100.0,
		float64(len(evidenceHashes))/float64(max(testTotal, 1)), passRate/100.0,
		criticalFailed, highFailed, []string{}, []string{}, []string{}, manifestHash, subjectID,
	)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "failed to create evaluation: " + err.Error()})
		return
	}

	// 6. Issue the passport
	issuedPassport, err := s.passportService.IssuePassport(
		ctx,
		req.OrganizationID,
		subjectID,
		assetName,
		"OWASP-LLM-TOP10",
		"1.0",
		evalID,
	)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "failed to issue passport: " + err.Error()})
		return
	}

	// 7. Link passport to audit order
	_, err = s.db.Exec(ctx, `
		UPDATE audit_orders SET passport_id = $2, status = 'COMPLETED', updated_at = NOW() WHERE id = $1
	`, req.AuditOrderID, issuedPassport.PassportID)
	if err != nil {
		// Non-fatal — passport was issued, just couldn't link it
		fmt.Printf("Warning: could not link passport %s to audit order %s: %v\n",
			issuedPassport.PassportID, req.AuditOrderID, err)
	}

	// 8. Log event
	_, _ = s.db.Exec(ctx, `
		INSERT INTO audit_events (organization_id, audit_order_id, event_type, actor_user_id, actor_type, payload)
		VALUES ($1, $2, 'PASSPORT_ISSUED', $3, 'system',
		  jsonb_build_object('passportId', $4, 'assuranceLevel', $5, 'trustScore', $6))
	`, req.OrganizationID, req.AuditOrderID, req.ReviewerUserID,
		issuedPassport.PassportID, issuedPassport.AssuranceLevel, passRate)

	// 9. Compute compliance coverage across legal frameworks
	type frameworkCoverage struct {
		FrameworkID   string   `json:"frameworkId"`
		FrameworkName string   `json:"frameworkName"`
		Jurisdiction  string   `json:"jurisdiction"`
		Mandatory     bool     `json:"mandatory"`
		Covered       int      `json:"controlsCovered"`
		Total         int      `json:"controlsTotal"`
		Status        string   `json:"status"`
		CoveredIDs    []string `json:"coveredControlIds"`
		GapIDs        []string `json:"gapControlIds,omitempty"`
	}

	// Get all frameworks and their total control counts
	complianceCoverage := []frameworkCoverage{}
	fwRows, err := s.db.Query(ctx, `
		SELECT cf.id, cf.name, cf.jurisdiction, cf.mandatory,
		       jsonb_array_length(cf.controls) as total_controls
		FROM compliance_frameworks cf
		ORDER BY cf.mandatory DESC, cf.name ASC
	`)
	if err == nil {
		defer fwRows.Close()
		for fwRows.Next() {
			var fw frameworkCoverage
			if fwRows.Scan(&fw.FrameworkID, &fw.FrameworkName, &fw.Jurisdiction, &fw.Mandatory, &fw.Total) == nil {
				// Find which controls in this framework are covered by our test categories
				coveredRows, err := s.db.Query(ctx, `
					SELECT DISTINCT fcm.control_id
					FROM framework_control_mappings fcm
					WHERE fcm.framework_id = $1
					  AND fcm.test_category = ANY($2::text[])
				`, fw.FrameworkID, categories)
				if err == nil {
					for coveredRows.Next() {
						var cid string
						if coveredRows.Scan(&cid) == nil {
							fw.CoveredIDs = append(fw.CoveredIDs, cid)
						}
					}
					coveredRows.Close()
				}
				fw.Covered = len(fw.CoveredIDs)

				// Determine coverage status
				if fw.Total > 0 && fw.Covered == fw.Total {
					fw.Status = "FULLY_COVERED"
				} else if fw.Covered > 0 {
					fw.Status = "PARTIALLY_COVERED"
				} else {
					fw.Status = "NOT_ASSESSED"
				}

				complianceCoverage = append(complianceCoverage, fw)
			}
		}
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"passportId":          issuedPassport.PassportID,
		"assuranceLevel":      issuedPassport.AssuranceLevel,
		"trustScore":          passRate,
		"status":              issuedPassport.Status,
		"issuedAt":            issuedPassport.IssuedAt,
		"expiresAt":           issuedPassport.ValidUntil,
		"complianceCoverage":  complianceCoverage,
		"testTotal":           testTotal,
		"testPassed":          testPassed,
		"testFailed":          testFailed,
		"evidenceManifestHash": manifestHash,
	})
}

func max(a, b int) int {
	if a > b {
		return a
	}
	return b
}

func join(items []string, sep string) string {
	return strings.Join(items, sep)
}

// handleWellKnownKeys returns the public signing key for passport verification
func (s *Server) handleWellKnownKeys(w http.ResponseWriter, r *http.Request) {
	vaultAddr := s.cfg.VaultAddr
	vaultToken := s.cfg.VaultToken

	if vaultAddr == "" || vaultToken == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusServiceUnavailable)
		json.NewEncoder(w).Encode(map[string]string{"error": "signing key not configured"})
		return
	}

	// Fetch the public key from Vault Transit
	url := fmt.Sprintf("%s/v1/transit/keys/passport-key", vaultAddr)
	req, err := http.NewRequestWithContext(r.Context(), "GET", url, nil)
	if err != nil {
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}
	req.Header.Set("X-Vault-Token", vaultToken)

	resp, err := http.DefaultClient.Do(req)
	if err != nil || resp.StatusCode != http.StatusOK {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusServiceUnavailable)
		json.NewEncoder(w).Encode(map[string]string{"error": "unable to retrieve signing key from vault"})
		return
	}
	defer resp.Body.Close()

	var vaultResp struct {
		Data struct {
			Keys map[string]struct {
				PublicKey string `json:"public_key"`
				Name      string `json:"name"`
			} `json:"keys"`
			Type string `json:"type"`
			Name string `json:"name"`
		} `json:"data"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&vaultResp); err != nil {
		http.Error(w, "failed to decode vault response", http.StatusInternalServerError)
		return
	}

	// Build well-known keys response
	type KeyInfo struct {
		KeyID     string `json:"keyId"`
		Algorithm string `json:"algorithm"`
		PublicKey string `json:"publicKey"`
		Use       string `json:"use"`
	}

	keys := []KeyInfo{}
	for version, keyData := range vaultResp.Data.Keys {
		keys = append(keys, KeyInfo{
			KeyID:     fmt.Sprintf("vault-transit:passport-key:v%s", version),
			Algorithm: "Ed25519",
			PublicKey: keyData.PublicKey,
			Use:       "passport-signing",
		})
	}

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Cache-Control", "public, max-age=3600")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"issuer": "Aegis Crucible",
		"keys":   keys,
	})
}
