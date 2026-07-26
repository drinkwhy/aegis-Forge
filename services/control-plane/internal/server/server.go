package server

import (
	"encoding/json"
	"net/http"
	"sync"
	"time"

	"github.com/aegis-forge/control-plane/internal/config"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/google/uuid"
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
	ID         string    `json:"id"`
	Title      string    `json:"title"`
	Severity   string    `json:"severity"`
	AgentName  string    `json:"agentName"`
	CreatedAt  time.Time `json:"created_at"`
}

type Server struct {
	cfg           *config.Config
	router        *chi.Mux
	mu            sync.Mutex
	campaigns     []Campaign
	findings      []Finding
}

func New(cfg *config.Config) *Server {
	s := &Server{
		cfg:    cfg,
		router: chi.NewRouter(),
		campaigns: []Campaign{
			{
				ID:            "1",
				Name:          "Continuous Hardening Loop",
				TargetAgentID: "agent_fin_advisor_01",
				Status:        "Running",
				TotalTests:    12,
				TestsRun:      8,
				FindingsCount: 1,
				CreatedAt:     time.Now().Add(-2 * time.Hour),
			},
			{
				ID:            "2",
				Name:          "Q3 Prompt Injection Baseline",
				TargetAgentID: "CustomerSupport-Bot",
				Status:        "Complete",
				TotalTests:    20,
				TestsRun:      20,
				FindingsCount: 0,
				CreatedAt:     time.Now().Add(-24 * time.Hour),
			},
		},
		findings: []Finding{
			{
				ID:        "1",
				Title:     "Honeyfact Exfiltration Leakage detected in Database Execution Query Tool",
				Severity:  "CRITICAL",
				AgentName: "Enterprise Financial Advisor Agent",
				CreatedAt: time.Now().Add(-2 * time.Hour),
			},
		},
	}
	s.setupMiddleware()
	s.setupRoutes()
	return s
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

	s.router.Route("/api/v1", func(r chi.Router) {
		r.Post("/auth/callback", s.handleAuthCallback)

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
				
				r.Post("/roe", s.createRoE)
				
				r.HandleFunc("/campaigns/{campaignID}/stream", s.wsStream)
			})
		})
	})
}

// Handler implementations
func (s *Server) handleAuthCallback(w http.ResponseWriter, r *http.Request) { w.WriteHeader(http.StatusOK) }
func (s *Server) listWorkspaces(w http.ResponseWriter, r *http.Request) { w.WriteHeader(http.StatusOK) }
func (s *Server) createWorkspace(w http.ResponseWriter, r *http.Request) { w.WriteHeader(http.StatusOK) }

func (s *Server) listCampaigns(w http.ResponseWriter, r *http.Request) {
	s.mu.Lock()
	defer s.mu.Unlock()
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"campaigns": s.campaigns,
	})
}

func (s *Server) createCampaign(w http.ResponseWriter, r *http.Request) {
	s.mu.Lock()
	defer s.mu.Unlock()

	var input struct {
		Name          string `json:"name"`
		TargetAgentID string `json:"target_agent_id"`
	}

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	c := Campaign{
		ID:            uuid.New().String(),
		Name:          input.Name,
		TargetAgentID: input.TargetAgentID,
		Status:        "Running",
		TotalTests:    10,
		TestsRun:      0,
		FindingsCount: 0,
		CreatedAt:     time.Now(),
	}

	s.campaigns = append([]Campaign{c}, s.campaigns...)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(c)
}

func (s *Server) getCampaign(w http.ResponseWriter, r *http.Request) { w.WriteHeader(http.StatusOK) }
func (s *Server) ingestMCP(w http.ResponseWriter, r *http.Request) { w.WriteHeader(http.StatusOK) }

func (s *Server) listFindings(w http.ResponseWriter, r *http.Request) {
	s.mu.Lock()
	defer s.mu.Unlock()
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"findings": s.findings,
	})
}

func (s *Server) getFinding(w http.ResponseWriter, r *http.Request) { w.WriteHeader(http.StatusOK) }
func (s *Server) createRoE(w http.ResponseWriter, r *http.Request) { w.WriteHeader(http.StatusOK) }
func (s *Server) wsStream(w http.ResponseWriter, r *http.Request) { w.WriteHeader(http.StatusOK) }
