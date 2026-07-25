package canary

import (
	"encoding/json"
	"io"
	"net/http"
	"sync"
	"time"

	"github.com/go-chi/chi/v5"
)

type SinkholeHit struct {
	TokenID   string
	Timestamp time.Time
	SourceIP  string
	UserAgent string
	Query     string
	Body      string
}

type SinkholeServer struct {
	router      *chi.Mux
	watched     map[string]string // tokenID -> campaignID
	hits        map[string][]SinkholeHit
	mu          sync.RWMutex
}

func NewSinkholeServer() *SinkholeServer {
	s := &SinkholeServer{
		router:  chi.NewRouter(),
		watched: make(map[string]string),
		hits:    make(map[string][]SinkholeHit),
	}
	s.setupRoutes()
	return s
}

func (s *SinkholeServer) setupRoutes() {
	s.router.Get("/hit/{tokenID}", s.handleHit)
	s.router.Post("/hit/{tokenID}", s.handleHit)
	
	s.router.Get("/hits/{tokenID}", s.getHits)
}

func (s *SinkholeServer) handleHit(w http.ResponseWriter, r *http.Request) {
	tokenID := chi.URLParam(r, "tokenID")
	
	s.mu.RLock()
	_, exists := s.watched[tokenID]
	s.mu.RUnlock()

	if !exists {
		w.WriteHeader(http.StatusNotFound)
		return
	}

	bodyBytes, _ := io.ReadAll(r.Body)

	hit := SinkholeHit{
		TokenID:   tokenID,
		Timestamp: time.Now(),
		SourceIP:  r.RemoteAddr,
		UserAgent: r.UserAgent(),
		Query:     r.URL.RawQuery,
		Body:      string(bodyBytes),
	}

	s.mu.Lock()
	s.hits[tokenID] = append(s.hits[tokenID], hit)
	s.mu.Unlock()

	w.WriteHeader(http.StatusOK)
}

func (s *SinkholeServer) getHits(w http.ResponseWriter, r *http.Request) {
	tokenID := chi.URLParam(r, "tokenID")
	
	s.mu.RLock()
	hits := s.hits[tokenID]
	s.mu.RUnlock()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(hits)
}

func (s *SinkholeServer) RegisterToken(tokenID, campaignID string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.watched[tokenID] = campaignID
}

func (s *SinkholeServer) Start(addr string) error {
	return http.ListenAndServe(addr, s.router)
}
