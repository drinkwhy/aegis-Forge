package sandbox

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/rs/zerolog/log"
)

// SandboxRuntime abstracts the underlying isolation technology.
// This interface is the key to the gVisor → Firecracker migration path:
// swap the implementation without changing any caller code.
type SandboxRuntime interface {
	// Provision creates a new isolated execution environment.
	Provision(ctx context.Context, spec SandboxSpec) (SandboxHandle, error)
	// Terminate destroys the environment and all ephemeral state.
	Terminate(ctx context.Context, id string) error
	// Exec runs a command inside the sandbox (for setup/seeding).
	Exec(ctx context.Context, id, command string, args []string) (ExecResult, error)
	// StreamEvents returns a channel of eBPF / syscall trace events.
	StreamEvents(ctx context.Context, id string) (<-chan SandboxEvent, error)
}

// SandboxSpec describes the desired sandbox configuration.
type SandboxSpec struct {
	// CampaignID links this sandbox to a test campaign.
	CampaignID string
	// RunID links to the specific corpus entry being tested.
	RunID string
	// AgentConfig contains the system prompt, tools, and MCP manifest of the target.
	AgentConfig AgentConfig
	// SyntheticData describes mock databases, files, and env vars to seed.
	SyntheticData SyntheticDataSpec
	// EgressPolicy restricts what domains the sandbox can reach.
	EgressPolicy EgressPolicy
	// MaxDurationSeconds is the hard wall-clock timeout for the sandbox.
	MaxDurationSeconds int
}

// AgentConfig is the configuration to load into the sandbox.
type AgentConfig struct {
	SystemPrompt  string            `json:"system_prompt"`
	ToolManifest  []ToolDefinition  `json:"tools"`
	MCPServers    []MCPServerConfig `json:"mcp_servers"`
	LLMBackend    string            `json:"llm_backend"` // e.g., "claude-3-5-sonnet"
	LLMBaseURL    string            `json:"llm_base_url"` // Override for sandbox mock
	EnvironmentVars map[string]string `json:"env_vars"`
}

// ToolDefinition mirrors an MCP tool schema.
type ToolDefinition struct {
	Name        string         `json:"name"`
	Description string         `json:"description"`
	InputSchema map[string]any `json:"input_schema"`
}

// MCPServerConfig describes an MCP server the agent connects to.
type MCPServerConfig struct {
	Name      string `json:"name"`
	Transport string `json:"transport"` // stdio | http
	Command   string `json:"command,omitempty"`
	URL       string `json:"url,omitempty"`
	// MockMode replaces the real server with a controlled mock.
	MockMode bool `json:"mock_mode"`
}

// SyntheticDataSpec describes what canary data to seed.
type SyntheticDataSpec struct {
	// EnvVars are injected into the sandbox process environment.
	EnvVars map[string]string `json:"env_vars"`
	// Files are written to the sandbox filesystem before the test.
	Files []SyntheticFile `json:"files"`
	// DBRecords are rows to insert into the mock database.
	DBRecords []SyntheticDBRecord `json:"db_records"`
	// CanaryTokenIDs are the registered canary token IDs to monitor.
	CanaryTokenIDs []string `json:"canary_token_ids"`
}

// SyntheticFile is a file to create in the sandbox.
type SyntheticFile struct {
	Path    string `json:"path"`
	Content string `json:"content"`
	Mode    uint32 `json:"mode"`
}

// SyntheticDBRecord is a row to insert into a mock database table.
type SyntheticDBRecord struct {
	Table  string         `json:"table"`
	Fields map[string]any `json:"fields"`
}

// EgressPolicy controls what the sandbox can reach on the network.
type EgressPolicy struct {
	// AllowedDomains is the allowlist of domains the sandbox may connect to.
	// Always includes the canary sinkhole domain (c.aegiscruc.io).
	AllowedDomains []string `json:"allowed_domains"`
	// BlockAll overrides AllowedDomains and drops all outbound traffic.
	BlockAll bool `json:"block_all"`
}

// SandboxHandle represents a running sandbox.
type SandboxHandle struct {
	ID        string
	Status    SandboxStatus
	CreatedAt time.Time
	// InternalIP is the sandbox's IP within the test VPC namespace.
	InternalIP string
	// MockAPIPort is where the mock MCP/API servers listen inside the sandbox network.
	MockAPIPort int
}

// SandboxStatus is the lifecycle state of a sandbox.
type SandboxStatus string

const (
	StatusProvisioning SandboxStatus = "PROVISIONING"
	StatusReady        SandboxStatus = "READY"
	StatusExecuting    SandboxStatus = "EXECUTING"
	StatusTerminated   SandboxStatus = "TERMINATED"
	StatusFailed       SandboxStatus = "FAILED"
)

// ExecResult is the result of running a command inside the sandbox.
type ExecResult struct {
	ExitCode int
	Stdout   string
	Stderr   string
	Duration time.Duration
}

// SandboxEvent is a single trace event from the eBPF sensor or egress proxy.
type SandboxEvent struct {
	SandboxID string
	Timestamp time.Time
	Type      SandboxEventType
	// Syscall events
	Syscall string
	PID     int
	// File events
	FilePath string
	FileOp   string // read | write | exec | delete
	// Network events
	DestIP   string
	DestPort int
	Protocol string
	Payload  []byte
	// Tool call events
	ToolName   string
	ToolParams map[string]any
	ToolResult string
}

// SandboxEventType categorizes what kind of event occurred.
type SandboxEventType string

const (
	EventTypeSyscall    SandboxEventType = "SYSCALL"
	EventTypeFileAccess SandboxEventType = "FILE_ACCESS"
	EventTypeNetwork    SandboxEventType = "NETWORK"
	EventTypeToolCall   SandboxEventType = "TOOL_CALL"
	EventTypeCanaryHit  SandboxEventType = "CANARY_HIT"
)

// Manager orchestrates sandbox lifecycle. It's the primary entry point
// for all sandbox operations used by the control plane.
type Manager struct {
	runtime SandboxRuntime
	// activeSandboxes tracks running sandboxes by ID.
	activeSandboxes map[string]*SandboxHandle
}

// NewManager creates a new sandbox manager backed by the given runtime.
// At MVP: pass a GVisorRuntime. At scale: pass a FirecrackerRuntime.
func NewManager(runtime SandboxRuntime) *Manager {
	return &Manager{
		runtime:         runtime,
		activeSandboxes: make(map[string]*SandboxHandle),
	}
}

// RunTestCampaign provisions a sandbox, executes a campaign run, and returns
// all events for analysis. The sandbox is always terminated regardless of outcome.
func (m *Manager) RunTestCampaign(ctx context.Context, spec SandboxSpec) ([]SandboxEvent, error) {
	log.Info().
		Str("campaign_id", spec.CampaignID).
		Str("run_id", spec.RunID).
		Msg("provisioning sandbox")

	handle, err := m.runtime.Provision(ctx, spec)
	if err != nil {
		return nil, fmt.Errorf("sandbox provision failed: %w", err)
	}

	// Always terminate the sandbox when done — even on error.
	// This is the core safety guarantee.
	defer func() {
		terminateCtx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
		defer cancel()
		if termErr := m.runtime.Terminate(terminateCtx, handle.ID); termErr != nil {
			log.Error().
				Str("sandbox_id", handle.ID).
				Err(termErr).
				Msg("failed to terminate sandbox — manual cleanup may be required")
		} else {
			log.Info().Str("sandbox_id", handle.ID).Msg("sandbox terminated")
		}
	}()

	// Stream events while the test executes
	eventCh, err := m.runtime.StreamEvents(ctx, handle.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to start event stream: %w", err)
	}

	var events []SandboxEvent
	for event := range eventCh {
		events = append(events, event)
	}

	return events, nil
}

// GenerateSandboxID creates a unique identifier for a new sandbox.
func GenerateSandboxID() string {
	return "sb-" + uuid.New().String()[:8]
}
