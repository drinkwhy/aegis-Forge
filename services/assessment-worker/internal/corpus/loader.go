package corpus

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"gopkg.in/yaml.v3"
)

// TestDefinition represents a single attack corpus entry
type TestDefinition struct {
	ID              string            `yaml:"id"`
	AttackClass     string            `yaml:"attack_class"`
	OWASPMapping    string            `yaml:"owasp_mapping"`
	MITREAtlas      string            `yaml:"mitre_atlas"`
	Severity        string            `yaml:"severity"`
	Preconditions   map[string]interface{} `yaml:"preconditions"`
	PayloadTemplate string            `yaml:"payload_template"`
	CanaryType      string            `yaml:"canary_type"`
	SuccessDetector string            `yaml:"success_detector"`
	SuccessPattern  string            `yaml:"success_pattern"`
	SandboxReqs     map[string]interface{} `yaml:"sandbox_requirements"`
	Tags            []string          `yaml:"tags"`
	References      []string          `yaml:"references"`
}

// AttackCategory maps test category names to corpus tags
var AttackCategoryTags = map[string][]string{
	"direct_prompt_injection":      {"direct", "prompt-injection"},
	"indirect_prompt_injection":    {"indirect", "prompt-injection"},
	"tool_poisoning":               {"tool-poisoning"},
	"parameter_smuggling":          {"parameter-smuggling"},
	"excessive_agency":             {"excessive-agency"},
	"unauthorized_tool_execution":  {"tool-execution", "excessive-agency"},
	"sensitive_data_exposure":      {"credential-harvesting", "data-exfiltration"},
	"privilege_authorization_failures": {"privilege-escalation"},
}

// LoadForCategories loads all test definitions matching the given categories
func LoadForCategories(corpusPath string, categories []string) ([]*TestDefinition, error) {
	var allDefs []*TestDefinition
	seen := map[string]bool{}

	// Collect required tags
	requiredTags := map[string]bool{}
	for _, cat := range categories {
		if tags, ok := AttackCategoryTags[cat]; ok {
			for _, tag := range tags {
				requiredTags[tag] = true
			}
		}
	}

	// Walk the corpus directory
	err := filepath.Walk(corpusPath, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if info.IsDir() || (!strings.HasSuffix(path, ".yaml") && !strings.HasSuffix(path, ".yml")) {
			return nil
		}

		data, err := os.ReadFile(path)
		if err != nil {
			return fmt.Errorf("failed to read %s: %w", path, err)
		}

		var def TestDefinition
		if err := yaml.Unmarshal(data, &def); err != nil {
			return fmt.Errorf("failed to parse %s: %w", path, err)
		}

		if def.ID == "" || seen[def.ID] {
			return nil
		}

		// Check if this test matches any required tags
		if len(requiredTags) > 0 {
			matched := false
			for _, tag := range def.Tags {
				if requiredTags[tag] {
					matched = true
					break
				}
			}
			if !matched {
				return nil
			}
		}

		seen[def.ID] = true
		allDefs = append(allDefs, &def)
		return nil
	})

	if err != nil {
		return nil, fmt.Errorf("failed to walk corpus: %w", err)
	}

	return allDefs, nil
}
