package server

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

// AuditOrder represents a paid assessment order
type AuditOrder struct {
	ID                     string     `json:"id"`
	OrganizationID         string     `json:"organizationId"`
	PurchaserUserID        string     `json:"purchaserUserId"`
	AssetID                string     `json:"assetId"`
	ProductCode            string     `json:"productCode"`
	Status                 string     `json:"status"`
	Amount                 int        `json:"amount"`
	Currency               string     `json:"currency"`
	StripeCheckoutSessionID *string   `json:"stripeCheckoutSessionId,omitempty"`
	StripePaymentIntentID  *string    `json:"stripePaymentIntentId,omitempty"`
	PassportID             *string    `json:"passportId,omitempty"`
	PaidAt                 *time.Time `json:"paidAt,omitempty"`
	CreatedAt              time.Time  `json:"createdAt"`
	UpdatedAt              time.Time  `json:"updatedAt"`
}

// AuditTarget represents a registered test target
type AuditTarget struct {
	ID                     string    `json:"id"`
	OrganizationID         string    `json:"organizationId"`
	AuditOrderID           string    `json:"auditOrderId"`
	AssetID                string    `json:"assetId"`
	TargetType             string    `json:"targetType"`
	Endpoint               string    `json:"endpoint"`
	AuthenticationReference *string  `json:"authenticationReference,omitempty"`
	Environment            string    `json:"environment"`
	OwnershipConfirmed     bool      `json:"ownershipConfirmed"`
	CreatedAt              time.Time `json:"createdAt"`
	UpdatedAt              time.Time `json:"updatedAt"`
}

// AssessmentExecution represents a queued or running assessment
type AssessmentExecution struct {
	ID             string     `json:"id"`
	OrganizationID string     `json:"organizationId"`
	AuditOrderID   string     `json:"auditOrderId"`
	TargetID       string     `json:"targetId"`
	Status         string     `json:"status"`
	TotalTests     int        `json:"totalTests"`
	CompletedTests int        `json:"completedTests"`
	FailedTests    int        `json:"failedTests"`
	StartedAt      *time.Time `json:"startedAt,omitempty"`
	CompletedAt    *time.Time `json:"completedAt,omitempty"`
	FailureReason  *string    `json:"failureReason,omitempty"`
	WorkerID       *string    `json:"workerId,omitempty"`
	CorrelationID  string     `json:"correlationId"`
	CreatedAt      time.Time  `json:"createdAt"`
}

// listAuditOrders returns all audit orders for an organization
func (s *Server) listAuditOrders(w http.ResponseWriter, r *http.Request) {
	orgID := chi.URLParam(r, "organizationId")

	rows, err := s.db.Query(r.Context(), `
		SELECT id, organization_id, purchaser_user_id, asset_id, product_code,
		       status, amount, currency, stripe_checkout_session_id,
		       stripe_payment_intent_id, passport_id, paid_at, created_at, updated_at
		FROM audit_orders
		WHERE organization_id = $1
		ORDER BY created_at DESC
	`, orgID)
	if err != nil {
		http.Error(w, `{"error":"database error"}`, http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	orders := []AuditOrder{}
	for rows.Next() {
		var o AuditOrder
		if err := rows.Scan(
			&o.ID, &o.OrganizationID, &o.PurchaserUserID, &o.AssetID,
			&o.ProductCode, &o.Status, &o.Amount, &o.Currency,
			&o.StripeCheckoutSessionID, &o.StripePaymentIntentID,
			&o.PassportID, &o.PaidAt, &o.CreatedAt, &o.UpdatedAt,
		); err == nil {
			orders = append(orders, o)
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"orders": orders})
}

// getAuditOrder returns a single audit order
func (s *Server) getAuditOrder(w http.ResponseWriter, r *http.Request) {
	orderID := chi.URLParam(r, "orderId")
	orgID := chi.URLParam(r, "organizationId")

	var o AuditOrder
	err := s.db.QueryRow(r.Context(), `
		SELECT id, organization_id, purchaser_user_id, asset_id, product_code,
		       status, amount, currency, stripe_checkout_session_id,
		       stripe_payment_intent_id, passport_id, paid_at, created_at, updated_at
		FROM audit_orders
		WHERE id = $1 AND organization_id = $2
	`, orderID, orgID).Scan(
		&o.ID, &o.OrganizationID, &o.PurchaserUserID, &o.AssetID,
		&o.ProductCode, &o.Status, &o.Amount, &o.Currency,
		&o.StripeCheckoutSessionID, &o.StripePaymentIntentID,
		&o.PassportID, &o.PaidAt, &o.CreatedAt, &o.UpdatedAt,
	)
	if err != nil {
		http.Error(w, `{"error":"not found"}`, http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(o)
}

// createAuditOrder creates a new DRAFT audit order
func (s *Server) createAuditOrder(w http.ResponseWriter, r *http.Request) {
	orgID := chi.URLParam(r, "organizationId")

	var input struct {
		PurchaserUserID string `json:"purchaserUserId"`
		AssetID         string `json:"assetId"`
		Amount          int    `json:"amount"`
		Currency        string `json:"currency"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, `{"error":"invalid request body"}`, http.StatusBadRequest)
		return
	}
	if input.PurchaserUserID == "" || input.AssetID == "" {
		http.Error(w, `{"error":"purchaserUserId and assetId are required"}`, http.StatusBadRequest)
		return
	}
	if input.Currency == "" {
		input.Currency = "usd"
	}

	o := AuditOrder{
		ID:              uuid.New().String(),
		OrganizationID:  orgID,
		PurchaserUserID: input.PurchaserUserID,
		AssetID:         input.AssetID,
		ProductCode:     "AEGIS_VERIFIED_LAUNCH_ASSESSMENT",
		Status:          "DRAFT",
		Amount:          input.Amount,
		Currency:        input.Currency,
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
	}

	_, err := s.db.Exec(r.Context(), `
		INSERT INTO audit_orders
		  (id, organization_id, purchaser_user_id, asset_id, product_code, status, amount, currency, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
	`, o.ID, o.OrganizationID, o.PurchaserUserID, o.AssetID,
		o.ProductCode, o.Status, o.Amount, o.Currency, o.CreatedAt, o.UpdatedAt)
	if err != nil {
		http.Error(w, `{"error":"failed to create order"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(o)
}

// getPaymentStatus returns the payment status for an order
func (s *Server) getPaymentStatus(w http.ResponseWriter, r *http.Request) {
	orderID := chi.URLParam(r, "orderId")
	orgID := chi.URLParam(r, "organizationId")

	var status, currency string
	var amount int
	var paidAt *time.Time
	var stripeSessionID *string

	err := s.db.QueryRow(r.Context(), `
		SELECT status, amount, currency, paid_at, stripe_checkout_session_id
		FROM audit_orders
		WHERE id = $1 AND organization_id = $2
	`, orderID, orgID).Scan(&status, &amount, &currency, &paidAt, &stripeSessionID)
	if err != nil {
		http.Error(w, `{"error":"not found"}`, http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"orderId":                orderID,
		"status":                 status,
		"paid":                   status == "PAID" || status == "ASSESSMENT_RUNNING" || status == "REVIEW_REQUIRED" || status == "COMPLETED",
		"amount":                 amount,
		"currency":               currency,
		"paidAt":                 paidAt,
		"stripeCheckoutSessionId": stripeSessionID,
	})
}

// listAssessmentResults returns test results for an audit order
func (s *Server) listAssessmentResults(w http.ResponseWriter, r *http.Request) {
	orderID := chi.URLParam(r, "orderId")
	orgID := chi.URLParam(r, "organizationId")

	// First get the execution for this order
	var execID string
	err := s.db.QueryRow(r.Context(), `
		SELECT id FROM assessment_executions
		WHERE audit_order_id = $1 AND organization_id = $2
		ORDER BY created_at DESC LIMIT 1
	`, orderID, orgID).Scan(&execID)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{"results": []interface{}{}})
		return
	}

	rows, err := s.db.Query(r.Context(), `
		SELECT id, test_definition_id, test_category, status, passed,
		       severity, request_summary, redacted_response, evidence_hash,
		       duration_ms, error, executed_at
		FROM assessment_test_results
		WHERE execution_id = $1
		ORDER BY executed_at ASC
	`, execID)
	if err != nil {
		http.Error(w, `{"error":"database error"}`, http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	type TestResult struct {
		ID               string     `json:"id"`
		TestDefinitionID string     `json:"testDefinitionId"`
		TestCategory     string     `json:"testCategory"`
		Status           string     `json:"status"`
		Passed           bool       `json:"passed"`
		Severity         string     `json:"severity"`
		RequestSummary   *string    `json:"requestSummary,omitempty"`
		RedactedResponse *string    `json:"redactedResponse,omitempty"`
		EvidenceHash     *string    `json:"evidenceHash,omitempty"`
		DurationMs       *int       `json:"durationMs,omitempty"`
		Error            *string    `json:"error,omitempty"`
		ExecutedAt       time.Time  `json:"executedAt"`
	}

	results := []TestResult{}
	for rows.Next() {
		var res TestResult
		if err := rows.Scan(
			&res.ID, &res.TestDefinitionID, &res.TestCategory, &res.Status,
			&res.Passed, &res.Severity, &res.RequestSummary, &res.RedactedResponse,
			&res.EvidenceHash, &res.DurationMs, &res.Error, &res.ExecutedAt,
		); err == nil {
			results = append(results, res)
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"executionId": execID,
		"results":     results,
	})
}

// getAssessmentStatus returns current execution status
func (s *Server) getAssessmentStatus(w http.ResponseWriter, r *http.Request) {
	orderID := chi.URLParam(r, "orderId")
	orgID := chi.URLParam(r, "organizationId")

	var execStatus string
	var totalTests, completedTests, failedTests int
	var startedAt, completedAt *time.Time
	var execID string

	err := s.db.QueryRow(r.Context(), `
		SELECT id, status, total_tests, completed_tests, failed_tests, started_at, completed_at
		FROM assessment_executions
		WHERE audit_order_id = $1 AND organization_id = $2
		ORDER BY created_at DESC LIMIT 1
	`, orderID, orgID).Scan(&execID, &execStatus, &totalTests, &completedTests, &failedTests, &startedAt, &completedAt)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{"status": "NOT_STARTED"})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"executionId":    execID,
		"status":         execStatus,
		"totalTests":     totalTests,
		"completedTests": completedTests,
		"failedTests":    failedTests,
		"startedAt":      startedAt,
		"completedAt":    completedAt,
	})
}
