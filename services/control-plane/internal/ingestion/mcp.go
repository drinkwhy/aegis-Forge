package ingestion

import (
	"context"
)

type MCPTool struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	InputSchema string `json:"inputSchema"`
}

type MCPServer struct {
	Name      string    `json:"name"`
	Transport string    `json:"transport"` // stdio, http
	Command   string    `json:"command"`
	URL       string    `json:"url"`
	Tools     []MCPTool `json:"tools"`
}

type MCPConfig struct {
	Servers map[string]MCPServer `json:"servers"`
}

func IngestMCPConfig(ctx context.Context, config MCPConfig, workspaceID string) error {
	// Stub implementation: parses config, creates Neo4j nodes for AI_Agent, MCP_Server, Tool, links them with USES_TOOL edges
	return nil
}
