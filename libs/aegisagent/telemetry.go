package aegisagent

import (
	"context"
	"time"
)

type ToolCallEvent struct {
	SessionID      string
	AgentID        string
	WorkspaceID    string
	ToolName       string
	Params         map[string]interface{}
	Result         interface{}
	DurationMs     int64
	PolicyDecision PolicyDecision
	Timestamp      time.Time
}

type TelemetryEmitter struct {
	workspaceID string
	// clickHouseURL string
}

func NewTelemetryEmitter(workspaceID string) *TelemetryEmitter {
	return &TelemetryEmitter{
		workspaceID: workspaceID,
	}
}

func (t *TelemetryEmitter) EmitToolCall(ctx context.Context, event ToolCallEvent) {
	// Fire and forget
	go func() {
		// In a real implementation, this would marshal the event to JSON
		// and POST it to ClickHouse HTTP interface
		_ = event
	}()
}
