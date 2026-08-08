package server

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type Organization struct {
	ID          string    `json:"id"`
	DisplayName string    `json:"display_name"`
	Slug        string    `json:"slug"`
	CreatedAt   time.Time `json:"created_at"`
}

func (s *Server) listOrganizations(w http.ResponseWriter, r *http.Request) {
	ownerID := "demo-user" // Default to demo user for now
	if h := r.Header.Get("X-User-Id"); h != "" {
		ownerID = h
	}

	rows, err := s.db.Query(r.Context(), `
		SELECT id, display_name, slug, created_at 
		FROM organizations 
		WHERE owner_user_id = $1 
		ORDER BY created_at DESC
	`, ownerID)
	if err != nil {
		http.Error(w, `{"error":"failed to list organizations"}`, http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var orgs []Organization
	for rows.Next() {
		var o Organization
		if err := rows.Scan(&o.ID, &o.DisplayName, &o.Slug, &o.CreatedAt); err == nil {
			orgs = append(orgs, o)
		}
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"organizations": orgs})
}

func (s *Server) createOrganization(w http.ResponseWriter, r *http.Request) {
	var input struct {
		DisplayName string `json:"displayName"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil || input.DisplayName == "" {
		http.Error(w, `{"error":"invalid organization name"}`, http.StatusBadRequest)
		return
	}

	ownerID := "demo-user"
	if h := r.Header.Get("X-User-Id"); h != "" {
		ownerID = h
	}

	orgID := uuid.New().String()
	slug := input.DisplayName // naive slug for demo

	_, err := s.db.Exec(r.Context(), `
		INSERT INTO organizations (id, owner_user_id, display_name, slug, created_at, updated_at)
		VALUES ($1, $2, $3, $4, NOW(), NOW())
	`, orgID, ownerID, input.DisplayName, slug)
	if err != nil {
		http.Error(w, `{"error":"failed to create organization"}`, http.StatusInternalServerError)
		return
	}

	_, _ = s.db.Exec(r.Context(), `
		INSERT INTO organization_members (organization_id, user_id, role, created_at)
		VALUES ($1, $2, 'owner', NOW())
	`, orgID, ownerID)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(Organization{
		ID:          orgID,
		DisplayName: input.DisplayName,
		Slug:        slug,
		CreatedAt:   time.Now(),
	})
}

func (s *Server) createAsset(w http.ResponseWriter, r *http.Request) {
	orgID := chi.URLParam(r, "organizationId")
	
	var input struct {
		Name        string `json:"name"`
		Description string `json:"description"`
		AssetType   string `json:"assetType"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil || input.Name == "" {
		http.Error(w, `{"error":"invalid asset data"}`, http.StatusBadRequest)
		return
	}

	assetType := input.AssetType
	if assetType == "" {
		assetType = "openai_compatible"
	}

	ownerID := "demo-user"
	if h := r.Header.Get("X-User-Id"); h != "" {
		ownerID = h
	}

	assetID := uuid.New().String()

	_, err := s.db.Exec(r.Context(), `
		INSERT INTO assets (id, organization_id, owner_user_id, name, description, asset_type, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
	`, assetID, orgID, ownerID, input.Name, input.Description, assetType)
	
	if err != nil {
		http.Error(w, `{"error":"failed to register asset"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"id":              assetID,
		"organization_id": orgID,
		"name":            input.Name,
		"asset_type":      assetType,
	})
}
