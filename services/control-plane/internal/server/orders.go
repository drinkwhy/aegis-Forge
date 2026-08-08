package server

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

func (s *Server) createAuditOrder(w http.ResponseWriter, r *http.Request) {
	var input struct {
		OrganizationID string `json:"organizationId"`
		AssetID        string `json:"assetId"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, `{"error":"invalid order data"}`, http.StatusBadRequest)
		return
	}

	ownerID := "demo-user"
	if h := r.Header.Get("X-User-Id"); h != "" {
		ownerID = h
	}

	orderID := uuid.New().String()

	_, err := s.db.Exec(r.Context(), `
		INSERT INTO audit_orders (id, organization_id, purchaser_user_id, asset_id, status, amount, currency, created_at, updated_at)
		VALUES ($1, $2, $3, $4, 'DRAFT', 250000, 'usd', NOW(), NOW())
	`, orderID, input.OrganizationID, ownerID, input.AssetID)
	
	if err != nil {
		http.Error(w, `{"error":"failed to create audit order"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"id": orderID,
		"organization_id": input.OrganizationID,
		"asset_id": input.AssetID,
		"status": "DRAFT",
	})
}

func (s *Server) updateAuditOrder(w http.ResponseWriter, r *http.Request) {
	orderID := chi.URLParam(r, "orderId")

	var input struct {
		Target *struct {
			TargetType         string `json:"targetType"`
			Endpoint           string `json:"endpoint"`
			Environment        string `json:"environment"`
			OwnershipConfirmed bool   `json:"ownershipConfirmed"`
		} `json:"target"`
		Roe *struct {
			PermittedTests      []string `json:"permittedTests"`
			ProhibitedActions   []string `json:"prohibitedActions"`
			AuthorizedEndpoints []string `json:"authorizedEndpoints"`
			RateLimit           int      `json:"rateLimit"`
			EmergencyContact    string   `json:"emergencyContact"`
			SignRoe             bool     `json:"signRoe"`
		} `json:"roe"`
	}

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, `{"error":"invalid update data"}`, http.StatusBadRequest)
		return
	}

	// Fetch order details
	var orgID, assetID string
	err := s.db.QueryRow(r.Context(), `
		SELECT organization_id, asset_id FROM audit_orders WHERE id = $1
	`, orderID).Scan(&orgID, &assetID)
	if err != nil {
		http.Error(w, `{"error":"order not found"}`, http.StatusNotFound)
		return
	}

	if input.Target != nil {
		_, err = s.db.Exec(r.Context(), `
			INSERT INTO audit_targets (organization_id, audit_order_id, asset_id, target_type, endpoint, environment, ownership_confirmed)
			VALUES ($1, $2, $3, $4, $5, $6, $7)
			ON CONFLICT DO NOTHING
		`, orgID, orderID, assetID, input.Target.TargetType, input.Target.Endpoint, input.Target.Environment, input.Target.OwnershipConfirmed)
		if err != nil {
			http.Error(w, `{"error":"failed to save target"}`, http.StatusInternalServerError)
			return
		}
	}

	if input.Roe != nil {
		var targetID string
		err := s.db.QueryRow(r.Context(), `
			SELECT id FROM audit_targets WHERE audit_order_id = $1 LIMIT 1
		`, orderID).Scan(&targetID)
		if err != nil {
			http.Error(w, `{"error":"target not found for order"}`, http.StatusBadRequest)
			return
		}

		status := "DRAFT"
		var signedAt *time.Time
		ownerID := "demo-user"
		if h := r.Header.Get("X-User-Id"); h != "" {
			ownerID = h
		}

		if input.Roe.SignRoe {
			status = "ACTIVE"
			t := time.Now()
			signedAt = &t
		}

		_, err = s.db.Exec(r.Context(), `
			INSERT INTO rules_of_engagement (
				organization_id, audit_order_id, target_id, 
				permitted_tests, prohibited_actions, authorized_endpoints, 
				rate_limit, emergency_contact, status, signed_by_user_id, signed_at
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
			ON CONFLICT DO NOTHING
		`, orgID, orderID, targetID, input.Roe.PermittedTests, input.Roe.ProhibitedActions, input.Roe.AuthorizedEndpoints,
			input.Roe.RateLimit, input.Roe.EmergencyContact, status, ownerID, signedAt)

		if err != nil {
			http.Error(w, `{"error":"failed to save roe"}`, http.StatusInternalServerError)
			return
		}
		
		_, _ = s.db.Exec(r.Context(), `UPDATE audit_orders SET status = 'PAYMENT_PENDING' WHERE id = $1`, orderID)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

func (s *Server) createCheckoutSession(w http.ResponseWriter, r *http.Request) {
	var input struct {
		AuditOrderID   string `json:"auditOrderId"`
		OrganizationID string `json:"organizationId"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, `{"error":"invalid checkout data"}`, http.StatusBadRequest)
		return
	}

	// Update order
	_, _ = s.db.Exec(r.Context(), `
		UPDATE audit_orders 
		SET status = 'PAID', paid_at = NOW() 
		WHERE id = $1
	`, input.AuditOrderID)

	w.Header().Set("Content-Type", "application/json")
	// For demo purposes, immediately redirect back to success page
	json.NewEncoder(w).Encode(map[string]string{
		"url": "/security-audit/success?session_id=mock_session_" + input.AuditOrderID,
	})
}
