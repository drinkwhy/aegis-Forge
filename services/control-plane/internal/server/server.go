package server

import (
	"encoding/json"
	"net/http"
	"sync"
	"time"

	"github.com/aegis-forge/control-plane/internal/config"
	"github.com/aegis-forge/control-plane/internal/passport"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Campaign struct {
	ID            string    `json:"id"`
	Name          string    `json:"name"`
	TargetAgentID string    `json:"target_agent_id"`
	Status        string    `json:"status"`
	TotalTests    int       `json:"total_tests"`
	TestsRun      int       `json:"tests_run"`
	FindingsCount int       `json:"findings_count"`
	CreatedAt     time.Time `json:"created_at"`
}

type Finding struct {
	ID        string    `json:"id"`
	Title     string    `json:"title"`
	Severity  string    `json:"severity"`
	CreatedAt time.Time `json:"created_at"`
}

type ProposedFix struct {
	Patch  string `json:"patch,omitempty"`
	Prompt string `json:"prompt,omitempty"`
}

type Remediation struct {
	ID           string      `json:"id"`
	FindingID    string      `json:"finding_id"`
	FindingTitle string      `json:"finding_title"`
	Severity     string      `json:"severity"`
	FixType      string      `json:"fix_type"`
	ProposedFix  ProposedFix `json:"proposed_fix"`
	PRURL        string      `json:"pr_url,omitempty"`
	Status       string      `json:"status"`
	ProposedAt   time.Time   `json:"proposed_at"`
}

type Server struct {
	cfg             *config.Config
	router          *chi.Mux
	mu              sync.Mutex
	remediations    []Remediation
	db              *pgxpool.Pool
	passportHandler *passport.PassportHandler
	passportService *passport.PassportService
}

func New(cfg *config.Config, db *pgxpool.Pool) *Server {
	passService := passport.NewPassportService(db, cfg.VaultAddr, cfg.VaultToken)
	s := &Server{
		cfg:             cfg,
		router:          chi.NewRouter(),
		remediations:    []Remediation{},
		db:              db,
		passportHandler: passport.NewPassportHandler(passService),
		passportService: passService,
	}
	s.setupMiddleware()
	s.setupRoutes()
	return s
}

// PassportService exposes the underlying service for main.go bootstrapping
func (s *Server) PassportService() *passport.PassportService {
	return s.passportService
}

func (s *Server) Router() *chi.Mux {
	return s.router
}

func (s *Server) setupMiddleware() {
	s.router.Use(middleware.RequestID)
	s.router.Use(middleware.RealIP)
	s.router.Use(middleware.Logger)
	s.router.Use(middleware.Recoverer)
	s.router.Use(middleware.Timeout(60 * time.Second))
}

func (s *Server) setupRoutes() {
	s.router.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{
			"status":  "ok",
			"version": "0.1.0",
		})
	})

	s.router.Get("/health/live", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"status": "alive"})
	})
	s.router.Get("/health/ready", func(w http.ResponseWriter, r *http.Request) {
		if s.db != nil {
			if err := s.db.Ping(r.Context()); err != nil {
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusServiceUnavailable)
				json.NewEncoder(w).Encode(map[string]string{"status": "not ready", "error": "db unreachable"})
				return
			}
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"status": "ready"})
	})

	// ── Public Key Endpoint ────────────────────────────────────────────────────
	// Allows third-party verification of passport signatures.
	s.router.Get("/.well-known/aegis-passport-keys.json", s.handleWellKnownKeys)

	s.router.Route("/api/v1", func(r chi.Router) {
		r.Post("/auth/callback", s.handleAuthCallback)

		// Verification Endpoints
		r.Post("/verify/passports/{passportId}", s.passportHandler.CreateVerificationToken)
		r.Get("/verify/passports/{passportId}", s.passportHandler.VerifyPassport)

		// Organization/System Passport Endpoints
		r.Route("/organizations/{organizationId}", func(r chi.Router) {
			r.Post("/systems/{systemId}/snapshots", s.passportHandler.CreateSnapshot)
			r.Post("/systems/{systemId}/heartbeat", s.passportHandler.RecordHeartbeat)

			r.Post("/evidence", s.passportHandler.CreateEvidence)
			r.Get("/evidence/{evidenceId}", s.passportHandler.GetEvidence)

			r.Post("/findings/{findingId}/dispositions", s.passportHandler.CreateFindingDisposition)
			r.Get("/findings/{findingId}/dispositions", s.passportHandler.GetFindingDispositions)

			r.Post("/assurance-evaluations", s.passportHandler.CreateEvaluation)
			r.Get("/assurance-evaluations/{evaluationId}", s.passportHandler.GetEvaluation)

			r.Post("/security-passports", s.passportHandler.IssuePassport)
			r.Get("/security-passports", s.passportHandler.ListPassports)
			r.Get("/security-passports/{passportId}", s.passportHandler.GetPassport)
			r.Post("/security-passports/{passportId}/revoke", s.passportHandler.RevokePassport)
			r.Post("/security-passports/{passportId}/suspend", s.passportHandler.SuspendPassport)
			r.Post("/security-passports/{passportId}/supersede", s.passportHandler.SupersedePassport)

			// AI System Registry
			r.Get("/systems", s.listAISystems)
			r.Post("/systems", s.createAISystem)
			r.Get("/systems/{systemId}", s.getAISystem)
			r.Patch("/systems/{systemId}", s.updateAISystem)

			// Runtime Events
			r.Post("/systems/{systemId}/events", s.ingestRuntimeEvent)
			r.Get("/systems/{systemId}/events", s.listRuntimeEvents)

			// Trust Summary (executive dashboard)
			r.Get("/trust-summary", s.getTrustSummary)
		})

		r.Route("/workspaces", func(r chi.Router) {
			r.Get("/", s.listWorkspaces)
			r.Post("/", s.createWorkspace)

			r.Route("/{workspaceID}", func(r chi.Router) {
				r.Get("/campaigns", s.listCampaigns)
				r.Post("/campaigns", s.createCampaign)
				r.Get("/campaigns/{campaignID}", s.getCampaign)

				r.Post("/assets/mcp", s.ingestMCP)

				r.Get("/findings", s.listFindings)
				r.Get("/findings/{findingID}", s.getFinding)

				r.Get("/remediations", s.listRemediations)

				r.Post("/roe", s.createRoE)

				r.HandleFunc("/campaigns/{campaignID}/stream", s.wsStream)
			})
		})

		// Audit Orders & Assessment routes
		r.Route("/organizations/{organizationId}/audit-orders", func(r chi.Router) {
			r.Get("/", s.listAuditOrders)
			r.Post("/", s.createAuditOrder)
			r.Get("/{orderId}", s.getAuditOrder)
			r.Get("/{orderId}/payment-status", s.getPaymentStatus)
			r.Get("/{orderId}/assessment-status", s.getAssessmentStatus)
			r.Get("/{orderId}/results", s.listAssessmentResults)
		})

		// Admin endpoints (secured by X-Api-Secret header)
		r.Post("/admin/issue-passport", s.handleAdminIssuePassport)
	})
}

// Handler implementations
func (s *Server) handleAuthCallback(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}
func (s *Server) listWorkspaces(w http.ResponseWriter, r *http.Request)     { w.WriteHeader(http.StatusOK) }
func (s *Server) createWorkspace(w http.ResponseWriter, r *http.Request)     { w.WriteHeader(http.StatusOK) }

func (s *Server) listCampaigns(w http.ResponseWriter, r *http.Request) {
	workspaceID := chi.URLParam(r, "workspaceID")
	rows, err := s.db.Query(r.Context(), `
		SELECT id, name, target_agent_id, status, total_tests, tests_run, findings_count, created_at
		FROM campaigns
		WHERE workspace_id = $1
		ORDER BY created_at DESC
	`, workspaceID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	list := []Campaign{}
	for rows.Next() {
		var c Campaign
		err := rows.Scan(&c.ID, &c.Name, &c.TargetAgentID, &c.Status, &c.TotalTests, &c.TestsRun, &c.FindingsCount, &c.CreatedAt)
		if err == nil {
			list = append(list, c)
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"campaigns": list,
	})
}

func (s *Server) createCampaign(w http.ResponseWriter, r *http.Request) {
	workspaceID := chi.URLParam(r, "workspaceID")
	var input struct {
		Name          string `json:"name"`
		TargetAgentID string `json:"target_agent_id"`
	}

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if input.Name == "" || input.TargetAgentID == "" {
		http.Error(w, "name and target_agent_id are required", http.StatusBadRequest)
		return
	}

	c := Campaign{
		ID:            uuid.New().String(),
		Name:          input.Name,
		TargetAgentID: input.TargetAgentID,
		Status:        "QUEUED",
		TotalTests:    0,
		TestsRun:      0,
		FindingsCount: 0,
		CreatedAt:     time.Now(),
	}

	_, err := s.db.Exec(r.Context(), `
		INSERT INTO campaigns (id, workspace_id, name, target_agent_id, status, total_tests, tests_run, findings_count, created_at)
		VALUES ($1, $2, $3, $4, 'QUEUED', 0, 0, 0, $5)
	`, c.ID, workspaceID, c.Name, c.TargetAgentID, c.CreatedAt)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusAccepted)
	json.NewEncoder(w).Encode(c)
}

func (s *Server) getCampaign(w http.ResponseWriter, r *http.Request) { w.WriteHeader(http.StatusOK) }
func (s *Server) ingestMCP(w http.ResponseWriter, r *http.Request)     { w.WriteHeader(http.StatusOK) }

func (s *Server) listFindings(w http.ResponseWriter, r *http.Request) {
	workspaceID := chi.URLParam(r, "workspaceID")
	rows, err := s.db.Query(r.Context(), `
		SELECT id, title, COALESCE(severity,'medium'), created_at
		FROM findings
		WHERE workspace_id = $1
		ORDER BY created_at DESC
	`, workspaceID)
	if err != nil {
		http.Error(w, `{"error":"database error"}`, http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	list := []Finding{}
	for rows.Next() {
		var f Finding
		err := rows.Scan(&f.ID, &f.Title, &f.Severity, &f.CreatedAt)
		if err == nil {
			list = append(list, f)
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"findings": list,
	})
}

func (s *Server) getFinding(w http.ResponseWriter, r *http.Request) {
	findingID := chi.URLParam(r, "findingID")
	var f Finding
	var desc, vulnClass, owaspCat string
	err := s.db.QueryRow(r.Context(), `
		SELECT id, title, COALESCE(severity,'medium'), created_at,
		       COALESCE(evidence->>'detail', ''),
		       COALESCE(vulnerability_class, ''),
		       COALESCE(owasp_category, '')
		FROM findings
		WHERE id = $1
	`, findingID).Scan(&f.ID, &f.Title, &f.Severity, &f.CreatedAt, &desc, &vulnClass, &owaspCat)
	if err != nil {
		http.Error(w, `{"error":"finding not found"}`, http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"id":                f.ID,
		"title":             f.Title,
		"severity":          f.Severity,
		"description":       desc,
		"vulnerabilityClass": vulnClass,
		"owaspCategory":     owaspCat,
		"timestamp":         f.CreatedAt.Format(time.RFC3339),
	})
}

func (s *Server) listRemediations(w http.ResponseWriter, r *http.Request) {
	s.mu.Lock()
	defer s.mu.Unlock()
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"remediations": s.remediations,
	})
}

func (s *Server) createRoE(w http.ResponseWriter, r *http.Request) { w.WriteHeader(http.StatusOK) }
func (s *Server) wsStream(w http.ResponseWriter, r *http.Request)  { w.WriteHeader(http.StatusOK) }
