package canary

import (
	"regexp"
	"strings"
	"time"
)

type Detector struct{}

func NewDetector() *Detector {
	return &Detector{}
}

func (d *Detector) DetectInOutput(output string, token CanaryToken) DetectionResult {
	if strings.Contains(output, token.Value) || 
	   (token.Type == Webhook && strings.Contains(output, token.WebhookURL)) {
		return DetectionResult{
			Detected:   true,
			TokenID:    token.ID,
			Confidence: 1.0,
			MatchedAt:  time.Now(),
			Evidence:   token.Value,
		}
	}
	return DetectionResult{Detected: false}
}

func (d *Detector) DetectEntropyAnomaly(output string) []string {
	var findings []string
	
	// Check for AWS-like keys
	awsRegex := regexp.MustCompile(`(?i)AKIA[0-9A-Z]{16}`)
	matches := awsRegex.FindAllString(output, -1)
	if len(matches) > 0 {
		findings = append(findings, matches...)
	}

	// Simplistic high entropy check
	base64Regex := regexp.MustCompile(`[A-Za-z0-9+/]{40,}`)
	b64Matches := base64Regex.FindAllString(output, -1)
	if len(b64Matches) > 0 {
		findings = append(findings, b64Matches...)
	}

	return findings
}
