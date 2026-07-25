package campaign

import "time"

type CampaignStatus string

const (
	StatusPending   CampaignStatus = "pending"
	StatusPlanning  CampaignStatus = "planning"
	StatusExecuting CampaignStatus = "executing"
	StatusAnalyzing CampaignStatus = "analyzing"
	StatusComplete  CampaignStatus = "complete"
	StatusFailed    CampaignStatus = "failed"
)

type Campaign struct {
	ID            string         `json:"id"`
	TenantID      string         `json:"tenant_id"`
	WorkspaceID   string         `json:"workspace_id"`
	RoEID         string         `json:"roe_id"`
	Name          string         `json:"name"`
	TargetAgentID string         `json:"target_agent_id,omitempty"`
	Status        CampaignStatus `json:"status"`
	AttackClasses []string       `json:"attack_classes"`
	TotalTests    int            `json:"total_tests"`
	TestsRun      int            `json:"tests_run"`
	FindingsCount int            `json:"findings_count"`
	CreatedAt     time.Time      `json:"created_at"`
	StartedAt     *time.Time     `json:"started_at,omitempty"`
	CompletedAt   *time.Time     `json:"completed_at,omitempty"`
}

type CampaignRun struct {
	ID              string     `json:"id"`
	TenantID        string     `json:"tenant_id"`
	CampaignID      string     `json:"campaign_id"`
	CorpusEntryID   string     `json:"corpus_entry_id"`
	Status          string     `json:"status"` // queued, running, success, failure, error
	SandboxID       string     `json:"sandbox_id,omitempty"`
	PayloadUsed     string     `json:"payload_used,omitempty"`
	DetectorResults string     `json:"detector_results,omitempty"`
	EvidenceRefs    []string   `json:"evidence_refs,omitempty"`
	StartedAt       *time.Time `json:"started_at,omitempty"`
	CompletedAt     *time.Time `json:"completed_at,omitempty"`
}
