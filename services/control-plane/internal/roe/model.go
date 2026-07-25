package roe

import "time"

type RoEDocument struct {
	ID                 string    `json:"id"`
	TenantID           string    `json:"tenant_id"`
	WorkspaceID        string    `json:"workspace_id"`
	Scope              []string  `json:"scope"`
	TimeWindow         string    `json:"time_window"`
	ProhibitedActions  []string  `json:"prohibited_actions"`
	AllowedTestClasses []string  `json:"allowed_test_classes"`
	Signature          string    `json:"signature"`
	SignedBy           string    `json:"signed_by"`
	SignedAt           time.Time `json:"signed_at"`
	ValidFrom          time.Time `json:"valid_from"`
	ValidUntil         time.Time `json:"valid_until"`
	IsActive           bool      `json:"is_active"`
}

type RoEViolation struct {
	ID              string    `json:"id"`
	TenantID        string    `json:"tenant_id"`
	RoEID           string    `json:"roe_id"`
	CampaignID      string    `json:"campaign_id"`
	ViolationType   string    `json:"violation_type"`
	AttemptedAction string    `json:"attempted_action"`
	BlockedAt       time.Time `json:"blocked_at"`
}

type ValidationResult struct {
	Allowed       bool
	ViolationType string
	Reason        string
}
