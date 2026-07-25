package canary

import "time"

type TokenType string

const (
	EnvCredential TokenType = "ENV_CREDENTIAL"
	FileContent   TokenType = "FILE_CONTENT"
	DBRecord      TokenType = "DB_RECORD"
	MemoryFact    TokenType = "MEMORY_FACT"
	Webhook       TokenType = "WEBHOOK"
)

type CanaryToken struct {
	ID         string
	Type       TokenType
	CampaignID string
	Value      string // The actual canary string to embed
	WebhookURL string // Populated if Type == Webhook
	HMAC       string // HMAC-SHA256 of ID+CampaignID using signing key
	CreatedAt  time.Time
}

type DetectionResult struct {
	Detected   bool
	TokenID    string
	Confidence float64 // 1.0 for deterministic, <1.0 for heuristic
	MatchedAt  time.Time
	Evidence   string // The matched substring
}
