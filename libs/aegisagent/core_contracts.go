package aegisagent

import (
	"time"
)

// Universal Entity Schema for Aegis Fabric
type EntityType string

const (
	EntityAgent               EntityType = "AGENT"
	EntityModel               EntityType = "MODEL"
	EntityTool                EntityType = "TOOL"
	EntityMCPServer           EntityType = "MCP_SERVER"
	EntityDataSource          EntityType = "DATA_SOURCE"
	EntityPrompt              EntityType = "PROMPT"
	EntityContext             EntityType = "CONTEXT"
	EntityAction              EntityType = "ACTION"
	EntitySecurityEvent       EntityType = "SECURITY_EVENT"
	EntityAttack              EntityType = "ATTACK"
	EntityFinding             EntityType = "FINDING"
	EntityPolicy              EntityType = "POLICY"
	EntitySentinel            EntityType = "SENTINEL"
	EntityExperiment          EntityType = "EXPERIMENT"
	EntityActivationCapture   EntityType = "ACTIVATION_CAPTURE"
	EntityTopologicalAnalysis EntityType = "TOPOLOGICAL_ANALYSIS"
)

type Relationship struct {
	SourceID string `json:"source_id"`
	TargetID string `json:"target_id"`
	Type     string `json:"type"` // e.g., USES_TOOL, INGESTS_DATA, FORGED_BY, DEPLOYED_TO
}

type AegisEntity struct {
	ID            string                 `json:"id"`
	Type          EntityType             `json:"type"`
	Name          string                 `json:"name"`
	Metadata      map[string]interface{} `json:"metadata"`
	OwnerID       string                 `json:"owner_id,omitempty"`
	CreatedAt     time.Time              `json:"created_at"`
	UpdatedAt     time.Time              `json:"updated_at"`
	Relationships []Relationship         `json:"relationships,omitempty"`
}

// Unified Security Observation
type SecurityObservationTarget struct {
	AgentID     string `json:"agent_id"`
	ModelID     string `json:"model_id,omitempty"`
	WorkspaceID string `json:"workspace_id"`
}

type SecurityObservationInput struct {
	PromptHash     string   `json:"prompt_hash"`
	ContextSources []string `json:"context_sources"`
	Provenance     string   `json:"provenance"` // TRUSTED, UNTRUSTED, HYBRID
}

type SecurityObservationAction struct {
	Type           string                 `json:"type"`
	ToolID         string                 `json:"tool_id,omitempty"`
	ParametersHash string                 `json:"parameters_hash,omitempty"`
	Parameters     map[string]interface{} `json:"parameters,omitempty"`
}

type BehavioralObservation struct {
	OutputRisk       float64  `json:"output_risk"`
	PolicyViolations []string `json:"policy_violations"`
}

type TelemetryObservation struct {
	CPU           float64 `json:"cpu"`
	Memory        float64 `json:"memory"`
	IO            float64 `json:"io"`
	ExecutionMs   int64   `json:"execution_ms"`
}

type TopologicalObservation struct {
	PersistenceEntropy float64 `json:"persistence_entropy,omitempty"`
	EntropyDelta       float64 `json:"entropy_delta,omitempty"`
	Beta0              int     `json:"beta0,omitempty"`
	Beta1              int     `json:"beta1,omitempty"`
	CompressionScore   float64 `json:"compression_score,omitempty"`
}

type DecisionAction string

const (
	ActionAllow  DecisionAction = "ALLOW"
	ActionBlock  DecisionAction = "BLOCK"
	ActionReview DecisionAction = "REVIEW"
)

type SecurityDecision struct {
	Action    DecisionAction `json:"action"`
	RiskScore float64        `json:"risk_score"`
	PolicyID  string         `json:"policy_id"`
	Reason    string         `json:"reason"`
}

type AegisSecurityObservation struct {
	ID         string                     `json:"id"`
	Timestamp  time.Time                  `json:"timestamp"`
	Target     SecurityObservationTarget `json:"target"`
	Input      SecurityObservationInput  `json:"input"`
	Action     *SecurityObservationAction `json:"action,omitempty"`
	Behavioral BehavioralObservation      `json:"behavioral"`
	Telemetry  *TelemetryObservation      `json:"telemetry,omitempty"`
	Topology   *TopologicalObservation    `json:"topology,omitempty"`
	Decision   SecurityDecision           `json:"decision"`
}

// Sentinel Lifecycle FSM
type SentinelStatus string

const (
	SentinelDraft      SentinelStatus = "DRAFT"
	SentinelSimulating SentinelStatus = "SIMULATING"
	SentinelValidated  SentinelStatus = "VALIDATED"
	SentinelStaged     SentinelStatus = "STAGED"
	SentinelCanary     SentinelStatus = "CANARY"
	SentinelActive     SentinelStatus = "ACTIVE"
	SentinelRetired    SentinelStatus = "RETIRED"
)

type SentinelGenome struct {
	Rules             []map[string]interface{} `json:"rules"`
	AttackCoverage    []string                 `json:"attack_coverage"`
	FitnessScore      float64                  `json:"fitness_score"`
	FalsePositiveRate float64                  `json:"false_positive_rate"`
}

type AegisSentinelPolicy struct {
	ID          string         `json:"id"`
	Version     int            `json:"version"`
	Origin      string         `json:"origin"` // e.g., "CRUCIBLE_FOUNDRY"
	TargetID    string         `json:"target_id"`
	Status      SentinelStatus `json:"status"`
	Genome      SentinelGenome `json:"genome"`
	EvidenceRef string         `json:"evidence_ref"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
}

// Council of Titans Plugin Interface Result
type TitanType string

const (
	TitanBehavioral  TitanType = "BEHAVIORAL"
	TitanMPED        TitanType = "MPED"
	TitanTopological TitanType = "TOPOLOGICAL"
	TitanGSAE        TitanType = "GSAE"
)

type TitanAnalysisResult struct {
	TitanType         TitanType              `json:"titan_type"`
	Anomalous         bool                   `json:"anomalous"`
	Confidence        float64                `json:"confidence"`
	Metrics           map[string]interface{} `json:"metrics"`
	RecommendedAction DecisionAction         `json:"recommended_action"`
}
