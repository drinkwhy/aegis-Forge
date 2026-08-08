package governance

import (
	"context"
	"encoding/json"
	"regexp"
	"strings"

	"github.com/rs/zerolog/log"
)

type RedactionService struct {
	// A map of token types to regex patterns
	patterns map[string]*regexp.Regexp
}

func NewRedactionService() *RedactionService {
	return &RedactionService{
		patterns: map[string]*regexp.Regexp{
			"BEARER_TOKEN":  regexp.MustCompile(`Bearer\s+[a-zA-Z0-9\-\._~+/]+=*`),
			"API_KEY":       regexp.MustCompile(`(api[_-]?key["']?\s*[:=]\s*["']?)[a-zA-Z0-9\-_]{20,}`),
			"CREDIT_CARD":   regexp.MustCompile(`\b(?:\d[ -]*?){13,16}\b`),
			"EMAIL_ADDRESS": regexp.MustCompile(`\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b`),
		},
	}
}

// RedactPayload takes a raw byte payload (typically JSON), identifies sensitive patterns,
// strips them, and replaces them with format-preserving tokens like <REDACTED_API_KEY>.
// This ensures logs and evidence do not leak sensitive values.
func (s *RedactionService) RedactPayload(ctx context.Context, payload []byte) ([]byte, error) {
	text := string(payload)

	for tokenType, pattern := range s.patterns {
		replacement := "<REDACTED_" + tokenType + ">"
		
		// For API keys, preserve the key name if captured
		if tokenType == "API_KEY" {
			text = pattern.ReplaceAllString(text, "${1}"+replacement)
		} else {
			text = pattern.ReplaceAllString(text, replacement)
		}
	}
	
	// Example format-preserving tokenization
	// E.g., john@example.com -> USR_HASH123 (mocked here for simplicity)
	text = strings.ReplaceAll(text, "<REDACTED_EMAIL_ADDRESS>", "USR_TOKENIZED_EMAIL")

	return []byte(text), nil
}

// RedactMap performs a deep traversal of a map[string]interface{} to mask sensitive keys before serialization.
func (s *RedactionService) RedactMap(data map[string]interface{}) map[string]interface{} {
	sensitiveKeys := map[string]bool{
		"password":      true,
		"secret":        true,
		"token":         true,
		"api_key":       true,
		"access_token":  true,
		"refresh_token": true,
	}

	redacted := make(map[string]interface{})
	for k, v := range data {
		lowerKey := strings.ToLower(k)
		isSensitive := false
		for sk := range sensitiveKeys {
			if strings.Contains(lowerKey, sk) {
				isSensitive = true
				break
			}
		}

		if isSensitive {
			redacted[k] = "<REDACTED_SECRET>"
			continue
		}

		// Recurse into nested maps
		if nestedMap, ok := v.(map[string]interface{}); ok {
			redacted[k] = s.RedactMap(nestedMap)
		} else if nestedJSON, err := json.Marshal(v); err == nil {
			// If it's a string or other structure, pass it through regex redaction just in case
			redactedBytes, _ := s.RedactPayload(context.Background(), nestedJSON)
			var unmarshaled interface{}
			json.Unmarshal(redactedBytes, &unmarshaled)
			redacted[k] = unmarshaled
		} else {
			redacted[k] = v
		}
	}
	return redacted
}
