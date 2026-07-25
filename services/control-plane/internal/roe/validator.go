package roe

import (
	"strings"
	"time"
)

type TestRequest struct {
	TargetURI string
	Action    string
	TestClass string
}

type RoEValidator struct{}

func NewRoEValidator() *RoEValidator {
	return &RoEValidator{}
}

func (v *RoEValidator) ValidateRequest(roe *RoEDocument, req *TestRequest) ValidationResult {
	if !roe.IsActive {
		return ValidationResult{Allowed: false, ViolationType: "inactive_roe", Reason: "RoE is inactive"}
	}

	now := time.Now()
	if now.Before(roe.ValidFrom) || now.After(roe.ValidUntil) {
		return ValidationResult{Allowed: false, ViolationType: "expired_window", Reason: "Outside of valid time window"}
	}

	targetInScope := false
	for _, scope := range roe.Scope {
		// basic prefix matching
		if strings.HasPrefix(req.TargetURI, scope) {
			targetInScope = true
			break
		}
	}
	if !targetInScope {
		return ValidationResult{Allowed: false, ViolationType: "out_of_scope_target", Reason: "Target URI not in scope"}
	}

	for _, prohibited := range roe.ProhibitedActions {
		if req.Action == prohibited {
			return ValidationResult{Allowed: false, ViolationType: "prohibited_action", Reason: "Action is prohibited"}
		}
	}

	classAllowed := false
	for _, allowed := range roe.AllowedTestClasses {
		if req.TestClass == allowed {
			classAllowed = true
			break
		}
	}
	if !classAllowed {
		return ValidationResult{Allowed: false, ViolationType: "disallowed_test_class", Reason: "Test class not allowed"}
	}

	return ValidationResult{Allowed: true}
}
