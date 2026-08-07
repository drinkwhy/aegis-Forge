package executor

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"regexp"
	"strings"
	"time"
)

// SecretPatterns are regexes used to redact secrets from responses
var secretPatterns = []*regexp.Regexp{
	regexp.MustCompile(`(?i)(bearer\s+)[a-zA-Z0-9\-._~+/]+=*`),
	regexp.MustCompile(`(?i)(api[_-]?key["']?\s*[:=]\s*["']?)[a-zA-Z0-9\-_]{20,}`),
	regexp.MustCompile(`(?i)(sk-[a-zA-Z0-9]{20,})`),
	regexp.MustCompile(`(?i)(secret["']?\s*[:=]\s*["']?)[a-zA-Z0-9\-_]{8,}`),
	regexp.MustCompile(`(?i)(password["']?\s*[:=]\s*["']?)[a-zA-Z0-9\-_@!#$%]{6,}`),
	regexp.MustCompile(`(eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+)`), // JWT
}

// RedactSecrets removes sensitive values from a string
func RedactSecrets(s string) string {
	for _, pattern := range secretPatterns {
		s = pattern.ReplaceAllStringFunc(s, func(match string) string {
			// Find where the value starts (after the prefix group)
			submatches := pattern.FindStringSubmatch(match)
			if len(submatches) > 1 {
				return submatches[1] + "[REDACTED]"
			}
			return "[REDACTED]"
		})
	}
	return s
}

// TestResult contains the outcome of a single test execution
type TestResult struct {
	Passed          bool
	Status          string // PASS, FAIL, ERROR, SKIPPED
	RequestSummary  string
	RedactedResponse string
	DurationMs      int
	Error           string
}

// OpenAIRequest represents a chat completion request
type OpenAIRequest struct {
	Model    string    `json:"model"`
	Messages []Message `json:"messages"`
}

type Message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// ExecuteOpenAI sends a test payload to an OpenAI-compatible endpoint and evaluates the response
func ExecuteOpenAI(ctx context.Context, endpoint, payload, successPattern string, headers map[string]string) (*TestResult, error) {
	start := time.Now()

	// Build a chat completion request using the payload as user content
	reqBody := OpenAIRequest{
		Model: "gpt-4o", // will be overridden by target's model
		Messages: []Message{
			{Role: "user", Content: payload},
		},
	}

	jsonBody, err := json.Marshal(reqBody)
	if err != nil {
		return &TestResult{Status: "ERROR", Error: err.Error(), DurationMs: int(time.Since(start).Milliseconds())}, nil
	}

	// Build request — always use /chat/completions endpoint
	targetURL := strings.TrimRight(endpoint, "/") + "/chat/completions"
	httpReq, err := http.NewRequestWithContext(ctx, "POST", targetURL, bytes.NewReader(jsonBody))
	if err != nil {
		return &TestResult{Status: "ERROR", Error: err.Error(), DurationMs: int(time.Since(start).Milliseconds())}, nil
	}
	httpReq.Header.Set("Content-Type", "application/json")
	for k, v := range headers {
		httpReq.Header.Set(k, v)
	}

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(httpReq)
	durationMs := int(time.Since(start).Milliseconds())
	if err != nil {
		return &TestResult{Status: "ERROR", Error: fmt.Sprintf("request failed: %v", err), DurationMs: durationMs}, nil
	}
	defer resp.Body.Close()

	bodyBytes, _ := io.ReadAll(io.LimitReader(resp.Body, 64*1024)) // limit to 64KB
	respBody := string(bodyBytes)

	// Redact secrets from response before storing
	redactedResp := RedactSecrets(respBody)

	// Summarize request (never include auth headers in summary)
	requestSummary := fmt.Sprintf("POST %s | payload_length=%d | model=gpt-4o", targetURL, len(payload))

	// Detect success (vulnerability triggered)
	vulnTriggered := false
	if successPattern != "" {
		vulnTriggered = strings.Contains(respBody, successPattern)
	}

	// A FAIL result means the attack SUCCEEDED (vulnerability found)
	status := "PASS"
	if vulnTriggered {
		status = "FAIL"
	}

	return &TestResult{
		Passed:           !vulnTriggered,
		Status:           status,
		RequestSummary:   requestSummary,
		RedactedResponse: redactedResp,
		DurationMs:       durationMs,
	}, nil
}

// ExecuteMCP sends a test payload to an MCP server endpoint
func ExecuteMCP(ctx context.Context, endpoint, payload, successPattern string, headers map[string]string) (*TestResult, error) {
	start := time.Now()

	// MCP protocol: send a tool call message
	mcpMsg := map[string]interface{}{
		"jsonrpc": "2.0",
		"id":      1,
		"method":  "tools/call",
		"params": map[string]interface{}{
			"name":      "test",
			"arguments": map[string]interface{}{"input": payload},
		},
	}

	jsonBody, err := json.Marshal(mcpMsg)
	if err != nil {
		return &TestResult{Status: "ERROR", Error: err.Error(), DurationMs: int(time.Since(start).Milliseconds())}, nil
	}

	targetURL := strings.TrimRight(endpoint, "/")
	httpReq, err := http.NewRequestWithContext(ctx, "POST", targetURL, bytes.NewReader(jsonBody))
	if err != nil {
		return &TestResult{Status: "ERROR", Error: err.Error(), DurationMs: int(time.Since(start).Milliseconds())}, nil
	}
	httpReq.Header.Set("Content-Type", "application/json")
	for k, v := range headers {
		httpReq.Header.Set(k, v)
	}

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(httpReq)
	durationMs := int(time.Since(start).Milliseconds())
	if err != nil {
		return &TestResult{Status: "ERROR", Error: fmt.Sprintf("request failed: %v", err), DurationMs: durationMs}, nil
	}
	defer resp.Body.Close()

	bodyBytes, _ := io.ReadAll(io.LimitReader(resp.Body, 64*1024))
	respBody := string(bodyBytes)
	redactedResp := RedactSecrets(respBody)

	requestSummary := fmt.Sprintf("POST %s | method=tools/call | payload_length=%d", targetURL, len(payload))

	vulnTriggered := false
	if successPattern != "" {
		vulnTriggered = strings.Contains(respBody, successPattern)
	}

	status := "PASS"
	if vulnTriggered {
		status = "FAIL"
	}

	return &TestResult{
		Passed:           !vulnTriggered,
		Status:           status,
		RequestSummary:   requestSummary,
		RedactedResponse: redactedResp,
		DurationMs:       durationMs,
	}, nil
}
