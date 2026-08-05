package server

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

// ─── AI System Registry ───────────────────────────────────────────────────────

type AISystem struct {
	ID                  string                 `json:"id"`
	OrganizationID      string                 `json:"organizationId"`
	Name                string                 `json:"name"`
	DisplayName         string                 `json:"displayName"`
	Purpose             string                 `json:"purpose"`
	Owner               string                 `json:"owner"`
	ModelProvider       string                 `json:"modelProvider"`
	ModelName           string                 `json:"modelName"`
	Version             string                 `json:"version"`
	Environment         string                 `json:"environment"`
	Status              string                 `json:"status"`
	Tags                []string               `json:"tags"`
	ConnectedTools      []map[string]interface{} `json:"connectedTools"`
	ConnectedMCPServers []map[string]interface{} `json:"connectedMcpServers"`
	ConnectedAPIs       []map[string]interface{} `json:"connectedApis"`
	ConnectedDatabases  []map[string]interface{} `json:"connectedDatabases"`
	DataClassifications []string               `json:"dataClassifications"`
	TrustScore          float64                `json:"trustScore"`
	TrustTrend          string                 `json:"trustTrend"`
	RiskLevel           string                 `json:"riskLevel"`
	LastEventAt         *time.Time             `json:"lastEventAt,omitempty"`
	PassportID          string                 `json:"passportId,omitempty"`
	RegisteredAt        time.Time              `json:"registeredAt"`
	UpdatedAt           time.Time              `json:"updatedAt"`
}

type RuntimeEvent struct {
	ID             string                 `json:"id"`
	OrganizationID string                 `json:"organizationId"`
	SystemID       string                 `json:"systemId"`
	EventType      string                 `json:"eventType"`
	Severity       string                 `json:"severity"`
	Actor          string                 `json:"actor"`
	Action         string                 `json:"action"`
	Resource       string                 `json:"resource"`
	Outcome        string                 `json:"outcome"`
	Metadata       map[string]interface{} `json:"metadata"`
	OccurredAt     time.Time             `json:"occurredAt"`
}

// listAISystems returns all AI systems for an organization
func (s *Server) listAISystems(w http.ResponseWriter, r *http.Request) {
	orgID := chi.URLParam(r, "organizationId")

	rows, err := s.db.Query(r.Context(), `
		SELECT id, organization_id, name, display_name,
		       COALESCE(purpose,''), COALESCE(owner,''),
		       COALESCE(model_provider,''), COALESCE(model_name,''),
		       COALESCE(version,'1.0.0'), COALESCE(environment,'production'),
		       COALESCE(status,'active'),
		       COALESCE(tags,'{}'),
		       COALESCE(connected_tools,'[]'::jsonb),
		       COALESCE(connected_mcp_servers,'[]'::jsonb),
		       COALESCE(connected_apis,'[]'::jsonb),
		       COALESCE(connected_databases,'[]'::jsonb),
		       COALESCE(data_classifications,'{}'),
		       COALESCE(trust_score,100.0),
		       COALESCE(trust_trend,'stable'),
		       COALESCE(risk_level,'low'),
		       last_event_at,
		       COALESCE(passport_id,''),
		       registered_at, updated_at
		FROM ai_systems
		WHERE organization_id = $1
		ORDER BY trust_score ASC, registered_at DESC
	`, orgID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	list := []AISystem{}
	for rows.Next() {
		var sys AISystem
		var tools, mcpServers, apis, databases []byte
		err := rows.Scan(
			&sys.ID, &sys.OrganizationID, &sys.Name, &sys.DisplayName,
			&sys.Purpose, &sys.Owner, &sys.ModelProvider, &sys.ModelName,
			&sys.Version, &sys.Environment, &sys.Status,
			&sys.Tags, &tools, &mcpServers, &apis, &databases,
			&sys.DataClassifications, &sys.TrustScore, &sys.TrustTrend,
			&sys.RiskLevel, &sys.LastEventAt, &sys.PassportID,
			&sys.RegisteredAt, &sys.UpdatedAt,
		)
		if err != nil {
			continue
		}
		json.Unmarshal(tools, &sys.ConnectedTools)
		json.Unmarshal(mcpServers, &sys.ConnectedMCPServers)
		json.Unmarshal(apis, &sys.ConnectedAPIs)
		json.Unmarshal(databases, &sys.ConnectedDatabases)
		list = append(list, sys)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(list)
}

// createAISystem registers a new AI system
func (s *Server) createAISystem(w http.ResponseWriter, r *http.Request) {
	orgID := chi.URLParam(r, "organizationId")
	var input struct {
		Name                string   `json:"name"`
		DisplayName         string   `json:"displayName"`
		Purpose             string   `json:"purpose"`
		Owner               string   `json:"owner"`
		ModelProvider       string   `json:"modelProvider"`
		ModelName           string   `json:"modelName"`
		Version             string   `json:"version"`
		Environment         string   `json:"environment"`
		Tags                []string `json:"tags"`
		DataClassifications []string `json:"dataClassifications"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if input.Name == "" {
		input.Name = input.DisplayName
	}
	if input.Version == "" {
		input.Version = "1.0.0"
	}
	if input.Environment == "" {
		input.Environment = "production"
	}

	id := uuid.New().String()
	now := time.Now()

	_, err := s.db.Exec(r.Context(), `
		INSERT INTO ai_systems (
			id, organization_id, name, display_name, purpose, owner,
			model_provider, model_name, version, environment, status,
			tags, data_classifications, trust_score, trust_trend, risk_level,
			registered_at, updated_at
		) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'active',$11,$12,100.0,'stable','low',$13,$14)
	`, id, orgID, input.Name, input.DisplayName, input.Purpose, input.Owner,
		input.ModelProvider, input.ModelName, input.Version, input.Environment,
		input.Tags, input.DataClassifications, now, now)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	sys := AISystem{
		ID: id, OrganizationID: orgID, Name: input.Name,
		DisplayName: input.DisplayName, Purpose: input.Purpose,
		Owner: input.Owner, ModelProvider: input.ModelProvider,
		ModelName: input.ModelName, Version: input.Version,
		Environment: input.Environment, Status: "active",
		Tags: input.Tags, DataClassifications: input.DataClassifications,
		TrustScore: 100.0, TrustTrend: "stable", RiskLevel: "low",
		RegisteredAt: now, UpdatedAt: now,
		ConnectedTools: []map[string]interface{}{},
		ConnectedMCPServers: []map[string]interface{}{},
		ConnectedAPIs: []map[string]interface{}{},
		ConnectedDatabases: []map[string]interface{}{},
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(sys)
}

// getAISystem returns a single AI system with live trust score
func (s *Server) getAISystem(w http.ResponseWriter, r *http.Request) {
	orgID := chi.URLParam(r, "organizationId")
	systemID := chi.URLParam(r, "systemId")

	var sys AISystem
	var tools, mcpServers, apis, databases []byte

	err := s.db.QueryRow(r.Context(), `
		SELECT id, organization_id, name, display_name,
		       COALESCE(purpose,''), COALESCE(owner,''),
		       COALESCE(model_provider,''), COALESCE(model_name,''),
		       COALESCE(version,'1.0.0'), COALESCE(environment,'production'),
		       COALESCE(status,'active'),
		       COALESCE(tags,'{}'),
		       COALESCE(connected_tools,'[]'::jsonb),
		       COALESCE(connected_mcp_servers,'[]'::jsonb),
		       COALESCE(connected_apis,'[]'::jsonb),
		       COALESCE(connected_databases,'[]'::jsonb),
		       COALESCE(data_classifications,'{}'),
		       COALESCE(trust_score,100.0),
		       COALESCE(trust_trend,'stable'),
		       COALESCE(risk_level,'low'),
		       last_event_at,
		       COALESCE(passport_id,''),
		       registered_at, updated_at
		FROM ai_systems
		WHERE id = $1 AND organization_id = $2
	`, systemID, orgID).Scan(
		&sys.ID, &sys.OrganizationID, &sys.Name, &sys.DisplayName,
		&sys.Purpose, &sys.Owner, &sys.ModelProvider, &sys.ModelName,
		&sys.Version, &sys.Environment, &sys.Status,
		&sys.Tags, &tools, &mcpServers, &apis, &databases,
		&sys.DataClassifications, &sys.TrustScore, &sys.TrustTrend,
		&sys.RiskLevel, &sys.LastEventAt, &sys.PassportID,
		&sys.RegisteredAt, &sys.UpdatedAt,
	)
	if err != nil {
		http.Error(w, "system not found", http.StatusNotFound)
		return
	}
	json.Unmarshal(tools, &sys.ConnectedTools)
	json.Unmarshal(mcpServers, &sys.ConnectedMCPServers)
	json.Unmarshal(apis, &sys.ConnectedAPIs)
	json.Unmarshal(databases, &sys.ConnectedDatabases)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(sys)
}

// updateAISystem allows patching fields on an AI system
func (s *Server) updateAISystem(w http.ResponseWriter, r *http.Request) {
	orgID := chi.URLParam(r, "organizationId")
	systemID := chi.URLParam(r, "systemId")
	var input map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	_, err := s.db.Exec(r.Context(), `
		UPDATE ai_systems SET updated_at = NOW()
		WHERE id = $1 AND organization_id = $2
	`, systemID, orgID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// ingestRuntimeEvent stores a runtime event and updates the system's last_event_at + trust score
func (s *Server) ingestRuntimeEvent(w http.ResponseWriter, r *http.Request) {
	orgID := chi.URLParam(r, "organizationId")
	systemID := chi.URLParam(r, "systemId")

	var input struct {
		EventType string                 `json:"eventType"`
		Severity  string                 `json:"severity"`
		Actor     string                 `json:"actor"`
		Action    string                 `json:"action"`
		Resource  string                 `json:"resource"`
		Outcome   string                 `json:"outcome"`
		Metadata  map[string]interface{} `json:"metadata"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	if input.Severity == "" {
		input.Severity = "info"
	}
	if input.Outcome == "" {
		input.Outcome = "allowed"
	}

	eventID := uuid.New().String()
	now := time.Now()
	metaBytes, _ := json.Marshal(input.Metadata)

	_, err := s.db.Exec(r.Context(), `
		INSERT INTO runtime_events (id, organization_id, system_id, event_type, severity, actor, action, resource, outcome, metadata, occurred_at, ingested_at)
		VALUES ($1, $2, $3::uuid, $4, $5, $6, $7, $8, $9, $10, $11, $11)
	`, eventID, orgID, systemID, input.EventType, input.Severity, input.Actor,
		input.Action, input.Resource, input.Outcome, metaBytes, now)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Update last_event_at and degrade trust score on violations
	trustDelta := 0.0
	if input.Outcome == "blocked" && (input.Severity == "high" || input.Severity == "critical") {
		trustDelta = -2.5
	} else if input.Outcome == "flagged" {
		trustDelta = -1.0
	}

	_, _ = s.db.Exec(r.Context(), `
		UPDATE ai_systems
		SET last_event_at = $1,
		    trust_score = GREATEST(0, LEAST(100, trust_score + $2)),
		    updated_at = $1
		WHERE id = $3::uuid AND organization_id = $4
	`, now, trustDelta, systemID, orgID)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"id": eventID, "status": "ingested"})
}

// listRuntimeEvents returns recent runtime events for a system
func (s *Server) listRuntimeEvents(w http.ResponseWriter, r *http.Request) {
	orgID := chi.URLParam(r, "organizationId")
	systemID := chi.URLParam(r, "systemId")

	rows, err := s.db.Query(r.Context(), `
		SELECT id, organization_id, COALESCE(system_id::text,''), event_type, severity,
		       COALESCE(actor,''), action, COALESCE(resource,''), outcome,
		       COALESCE(metadata,'{}'), occurred_at
		FROM runtime_events
		WHERE system_id = $1::uuid AND organization_id = $2
		ORDER BY occurred_at DESC
		LIMIT 100
	`, systemID, orgID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	list := []RuntimeEvent{}
	for rows.Next() {
		var ev RuntimeEvent
		var meta []byte
		err := rows.Scan(&ev.ID, &ev.OrganizationID, &ev.SystemID,
			&ev.EventType, &ev.Severity, &ev.Actor, &ev.Action,
			&ev.Resource, &ev.Outcome, &meta, &ev.OccurredAt)
		if err == nil {
			json.Unmarshal(meta, &ev.Metadata)
			list = append(list, ev)
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(list)
}

// getTrustSummary returns org-level trust metrics for the executive dashboard
func (s *Server) getTrustSummary(w http.ResponseWriter, r *http.Request) {
	orgID := chi.URLParam(r, "organizationId")

	var total, trusted, needsAttention, critical int
	var avgTrust float64

	_ = s.db.QueryRow(r.Context(), `
		SELECT
			COUNT(*) as total,
			COUNT(*) FILTER (WHERE trust_score >= 85) as trusted,
			COUNT(*) FILTER (WHERE trust_score >= 50 AND trust_score < 85) as needs_attention,
			COUNT(*) FILTER (WHERE trust_score < 50) as critical,
			COALESCE(AVG(trust_score), 0) as avg_trust
		FROM ai_systems
		WHERE organization_id = $1 AND status != 'decommissioned'
	`, orgID).Scan(&total, &trusted, &needsAttention, &critical, &avgTrust)

	var openCritical, openHigh int
	_ = s.db.QueryRow(r.Context(), `
		SELECT
			COUNT(*) FILTER (WHERE severity = 'critical') as critical_findings,
			COUNT(*) FILTER (WHERE severity = 'high') as high_findings
		FROM findings
		WHERE tenant_id = $1
	`, orgID).Scan(&openCritical, &openHigh)

	var validPassports, totalPassports int
	_ = s.db.QueryRow(r.Context(), `
		SELECT
			COUNT(*) FILTER (WHERE status = 'VALID') as valid,
			COUNT(*) as total
		FROM security_passports
		WHERE organization_id = $1
	`, orgID).Scan(&validPassports, &totalPassports)

	var recentViolations int
	_ = s.db.QueryRow(r.Context(), `
		SELECT COUNT(*) FROM runtime_events
		WHERE organization_id = $1
		  AND outcome IN ('blocked','flagged')
		  AND occurred_at > NOW() - INTERVAL '24 hours'
	`, orgID).Scan(&recentViolations)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"totalSystems":      total,
		"trustedSystems":    trusted,
		"needsAttention":    needsAttention,
		"criticalSystems":   critical,
		"avgTrustScore":     avgTrust,
		"openCriticalFindings": openCritical,
		"openHighFindings":  openHigh,
		"validPassports":    validPassports,
		"totalPassports":    totalPassports,
		"violations24h":     recentViolations,
		"updatedAt":         time.Now(),
	})
}
