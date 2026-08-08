package auditcase

import (
	"context"
	"errors"
	"fmt"
	"log"
	"time"
)

type State string

const (
	Draft                State = "DRAFT"
	SystemRegistered     State = "SYSTEM_REGISTERED"
	ConnectionVerified   State = "CONNECTION_VERIFIED"
	RulesAccepted        State = "RULES_ACCEPTED"
	ReadyForPayment      State = "READY_FOR_PAYMENT"
	PaymentPending       State = "PAYMENT_PENDING"
	PaymentConfirmed     State = "PAYMENT_CONFIRMED"
	ReadinessCheck       State = "READINESS_CHECK"
	ReadyForAssessment   State = "READY_FOR_ASSESSMENT"
	AssessmentRunning    State = "ASSESSMENT_RUNNING"
	AnalyzingResults     State = "ANALYZING_RESULTS"
	GeneratingFindings   State = "GENERATING_FINDINGS"
	ComplianceEvaluation State = "COMPLIANCE_EVALUATION"
	EvidenceMapping      State = "EVIDENCE_MAPPING"
	GapAnalysis          State = "GAP_ANALYSIS"
	EvidenceComplete     State = "EVIDENCE_COMPLETE"
	AssuranceEvaluation  State = "ASSURANCE_EVALUATION"
	RemediationRequired  State = "REMEDIATION_REQUIRED"
	ReadyForRetest       State = "READY_FOR_RETEST"
	RetestRunning        State = "RETEST_RUNNING"
	ReadyForReview       State = "READY_FOR_REVIEW"
	UnderReview          State = "UNDER_REVIEW"
	Approved             State = "APPROVED"
	PassportGeneration   State = "PASSPORT_GENERATION"
	PassportIssued       State = "PASSPORT_ISSUED"
	Monitoring           State = "MONITORING"
)

type EventPublisher interface {
	Publish(ctx context.Context, topic, key string, value interface{}) error
}

type StateMachine struct {
	publisher EventPublisher
	db        Database // abstract interface for DB
}

type Database interface {
	GetAuditCaseState(ctx context.Context, id string) (State, error)
	UpdateAuditCaseState(ctx context.Context, id string, newState State) error
}

func NewStateMachine(publisher EventPublisher, db Database) *StateMachine {
	return &StateMachine{
		publisher: publisher,
		db:        db,
	}
}

var validTransitions = map[State]map[State]bool{
	Draft:                {SystemRegistered: true},
	SystemRegistered:     {ConnectionVerified: true},
	ConnectionVerified:   {RulesAccepted: true},
	RulesAccepted:        {ReadyForPayment: true},
	ReadyForPayment:      {PaymentPending: true, PaymentConfirmed: true},
	PaymentPending:       {PaymentConfirmed: true},
	PaymentConfirmed:     {ReadinessCheck: true},
	ReadinessCheck:       {ReadyForAssessment: true},
	ReadyForAssessment:   {AssessmentRunning: true},
	AssessmentRunning:    {AnalyzingResults: true},
	AnalyzingResults:     {GeneratingFindings: true},
	GeneratingFindings:   {ComplianceEvaluation: true},
	ComplianceEvaluation: {EvidenceMapping: true},
	EvidenceMapping:      {GapAnalysis: true},
	GapAnalysis:          {EvidenceComplete: true, RemediationRequired: true},
	EvidenceComplete:     {AssuranceEvaluation: true},
	AssuranceEvaluation:  {RemediationRequired: true, ReadyForReview: true},
	RemediationRequired:  {ReadyForRetest: true},
	ReadyForRetest:       {RetestRunning: true},
	RetestRunning:        {AnalyzingResults: true},
	ReadyForReview:       {UnderReview: true},
	UnderReview:          {Approved: true, RemediationRequired: true},
	Approved:             {PassportGeneration: true},
	PassportGeneration:   {PassportIssued: true},
	PassportIssued:       {Monitoring: true},
}

type TransitionEvent struct {
	AuditCaseID string    `json:"audit_case_id"`
	OldState    State     `json:"old_state"`
	NewState    State     `json:"new_state"`
	Timestamp   time.Time `json:"timestamp"`
}

func (sm *StateMachine) Transition(ctx context.Context, auditCaseID string, newState State) error {
	currentState, err := sm.db.GetAuditCaseState(ctx, auditCaseID)
	if err != nil {
		return fmt.Errorf("failed to get current state: %w", err)
	}

	if allowed := validTransitions[currentState][newState]; !allowed {
		return fmt.Errorf("invalid transition from %s to %s", currentState, newState)
	}

	err = sm.db.UpdateAuditCaseState(ctx, auditCaseID, newState)
	if err != nil {
		return fmt.Errorf("failed to update state in db: %w", err)
	}

	event := TransitionEvent{
		AuditCaseID: auditCaseID,
		OldState:    currentState,
		NewState:    newState,
		Timestamp:   time.Now().UTC(),
	}

	// Determine topic name based on state
	topic := fmt.Sprintf("auditcase.%s", newState) // e.g., auditcase.PAYMENT_CONFIRMED

	err = sm.publisher.Publish(ctx, topic, auditCaseID, event)
	if err != nil {
		log.Printf("Failed to publish event to topic %s: %v", topic, err)
		// We log the error but don't fail the transaction, though in a real system we might want outbox pattern.
	}

	// For the new architectural requirements, orchestrating events automatically triggers next phases.
	return nil
}
