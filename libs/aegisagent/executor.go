package aegisagent

import (
	"context"
	"fmt"
	"strings"
	"time"
)

type ToolExecutor interface {
	Execute(ctx context.Context, toolName string, params map[string]interface{}) (interface{}, error)
}

type SafeExecutor struct {
	executor ToolExecutor
	policy   *PolicyChecker
	telemetry *TelemetryEmitter
}

func WrapExecutor(executor ToolExecutor, cfg Config) *SafeExecutor {
	return &SafeExecutor{
		executor: executor,
		policy:   NewPolicyChecker(cfg.ControlPlaneURL, cfg.APIKey),
		telemetry: NewTelemetryEmitter(cfg.WorkspaceID), // ClickHouse URL would be in config for real usage
	}
}

func (s *SafeExecutor) Execute(ctx context.Context, sessionID, agentID, toolName string, params map[string]interface{}) (interface{}, error) {
	start := time.Now()

	decision, err := s.policy.Check(ctx, toolName, params)
	if err != nil {
		return nil, fmt.Errorf("policy check failed: %w", err)
	}

	if !decision.Allowed {
		return nil, fmt.Errorf("tool execution blocked by policy: %s", decision.Reason)
	}

	// Simplistic vault fetch simulation
	for k, v := range params {
		if str, ok := v.(string); ok && strings.HasPrefix(str, "vault://") {
			// In reality, this would talk to HashiCorp Vault
			params[k] = "fetched-secret-value"
		}
	}

	result, execErr := s.executor.Execute(ctx, toolName, params)
	durationMs := time.Since(start).Milliseconds()

	// Log telemetry (fire and forget)
	event := ToolCallEvent{
		SessionID:      sessionID,
		AgentID:        agentID,
		WorkspaceID:    s.telemetry.workspaceID,
		ToolName:       toolName,
		Params:         params,
		Result:         result,
		DurationMs:     durationMs,
		PolicyDecision: decision,
		Timestamp:      time.Now(),
	}
	s.telemetry.EmitToolCall(ctx, event)

	return result, execErr
}
