package server

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/aegis-forge/control-plane/internal/config"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

type Server struct {
	cfg    *config.Config
	router *chi.Mux
}

func New(cfg *config.Config) *Server {
	s := &Server{
		cfg:    cfg,
		router: chi.NewRouter(),
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
	s.router.Use(middleware.Logger) // In a real app, use a zerolog middleware here
	s.router.Use(middleware.Recoverer)
	s.router.Use(middleware.Timeout(60 * time.Second))
	// CORS omitted for brevity, should allow aegisforge.io
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

		// Auth middleware would be applied here in reality
		// r.Use(auth.Middleware(s.cfg))

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

// Stub handlers
func (s *Server) handleAuthCallback(w http.ResponseWriter, r *http.Request) { w.WriteHeader(http.StatusOK) }
func (s *Server) listWorkspaces(w http.ResponseWriter, r *http.Request) { w.WriteHeader(http.StatusOK) }
func (s *Server) createWorkspace(w http.ResponseWriter, r *http.Request) { w.WriteHeader(http.StatusOK) }
func (s *Server) listCampaigns(w http.ResponseWriter, r *http.Request) { w.WriteHeader(http.StatusOK) }
func (s *Server) createCampaign(w http.ResponseWriter, r *http.Request) { w.WriteHeader(http.StatusOK) }
func (s *Server) getCampaign(w http.ResponseWriter, r *http.Request) { w.WriteHeader(http.StatusOK) }
func (s *Server) ingestMCP(w http.ResponseWriter, r *http.Request) { w.WriteHeader(http.StatusOK) }
func (s *Server) listFindings(w http.ResponseWriter, r *http.Request) { w.WriteHeader(http.StatusOK) }
func (s *Server) getFinding(w http.ResponseWriter, r *http.Request) { w.WriteHeader(http.StatusOK) }
func (s *Server) createRoE(w http.ResponseWriter, r *http.Request) { w.WriteHeader(http.StatusOK) }
func (s *Server) wsStream(w http.ResponseWriter, r *http.Request) { w.WriteHeader(http.StatusOK) }
