package passport

import (
	"encoding/json"
	"time"
)

type EvidenceType string
const (
	EvidenceTypeValidationResult        EvidenceType = "VALIDATION_RESULT"
	EvidenceTypeConfigurationSnapshot   EvidenceType = "CONFIGURATION_SNAPSHOT"
	EvidenceTypeControlTelemetry        EvidenceType = "CONTROL_TELEMETRY"
	EvidenceTypeManualReview            EvidenceType = "MANUAL_REVIEW"
	EvidenceTypeCodeAttestation         EvidenceType = "CODE_ATTESTATION"
	EvidenceTypeDeploymentAttestation   EvidenceType = "DEPLOYMENT_ATTESTATION"
	EvidenceTypeAuditLogExtract         EvidenceType = "AUDIT_LOG_EXTRACT"
)

type SubjectType string
const (
	SubjectTypeSystem     SubjectType = "SYSTEM"
	SubjectTypeAgent      SubjectType = "AGENT"
	SubjectTypeModel      SubjectType = "MODEL"
	SubjectTypeTool       SubjectType = "TOOL"
	SubjectTypeMCPServer  SubjectType = "MCP_SERVER"
	SubjectTypeDeployment SubjectType = "DEPLOYMENT"
)

type ReviewStatus string
const (
	ReviewStatusUnreviewed ReviewStatus = "UNREVIEWED"
	ReviewStatusAccepted   ReviewStatus = "ACCEPTED"
	ReviewStatusRejected   ReviewStatus = "REJECTED"
)

type IntegrityStatus string
const (
	IntegrityStatusVerified IntegrityStatus = "VERIFIED"
	IntegrityStatusFailed   IntegrityStatus = "FAILED"
	IntegrityStatusUnknown  IntegrityStatus = "UNKNOWN"
)

type EvaluationStatus string
const (
	EvaluationStatusNotAssessed       EvaluationStatus = "NOT_ASSESSED"
	EvaluationStatusIncomplete        EvaluationStatus = "INCOMPLETE"
	EvaluationStatusConditionallyReady EvaluationStatus = "CONDITIONALLY_READY"
	EvaluationStatusReady             EvaluationStatus = "READY"
	EvaluationStatusDegraded          EvaluationStatus = "DEGRADED"
	EvaluationStatusRevoked           EvaluationStatus = "REVOKED"
	EvaluationStatusExpired           EvaluationStatus = "EXPIRED"
)

type PassportStatus string
const (
	PassportStatusValid     PassportStatus = "VALID"
	PassportStatusDegraded  PassportStatus = "DEGRADED"
	PassportStatusSuspended PassportStatus = "SUSPENDED"
	PassportStatusRevoked   PassportStatus = "REVOKED"
	PassportStatusExpired   PassportStatus = "EXPIRED"
)

type AssuranceLevel string
const (
	AssuranceLevelObserved            AssuranceLevel = "OBSERVED"
	AssuranceLevelTested              AssuranceLevel = "TESTED"
	AssuranceLevelVerified            AssuranceLevel = "VERIFIED"
	AssuranceLevelContinuouslyVerified AssuranceLevel = "CONTINUOUSLY_VERIFIED"
)

// SubjectSnapshot represents the system state snapshot
type SubjectSnapshot struct {
	ID                 string                 `json:"id" db:"id"`
	OrganizationID     string                 `json:"organizationId" db:"organization_id"`
	SystemID           string                 `json:"systemId" db:"system_id"`
	SubjectFingerprint string                 `json:"subjectFingerprint" db:"subject_fingerprint"`
	SnapshotData       map[string]interface{} `json:"snapshotData" db:"snapshot_data"`
	CreatedAt          time.Time              `json:"createdAt" db:"created_at"`
}

// EvidenceArtifact represents concrete evidence satisfying framework requirements
type EvidenceArtifact struct {
	ID                 string          `json:"id" db:"id"`
	OrganizationID     string          `json:"organizationId" db:"organization_id"`
	EvidenceType       EvidenceType    `json:"evidenceType" db:"evidence_type"`
	SubjectType        SubjectType     `json:"subjectType" db:"subject_type"`
	SubjectID          string          `json:"subjectId" db:"subject_id"`
	SourceSystem       string          `json:"sourceSystem" db:"source_system"`
	SourceRecordID     string          `json:"sourceRecordId,omitempty" db:"source_record_id"`
	CapturedAt         time.Time       `json:"capturedAt" db:"captured_at"`
	ValidFrom          time.Time       `json:"validFrom" db:"valid_from"`
	ExpiresAt          *time.Time      `json:"expiresAt,omitempty" db:"expires_at"`
	ContentHash        string          `json:"contentHash" db:"content_hash"`
	StorageURI         string          `json:"storageUri" db:"storage_uri"`
	SchemaVersion      string          `json:"schemaVersion" db:"schema_version"`
	CollectorIdentity  string          `json:"collectorIdentity" db:"collector_identity"`
	ReviewerIdentity   string          `json:"reviewerIdentity,omitempty" db:"reviewer_identity"`
	ReviewStatus       ReviewStatus    `json:"reviewStatus" db:"review_status"`
	FrameworkID        string          `json:"frameworkId" db:"framework_id"`
	FrameworkVersionID string          `json:"frameworkVersionId" db:"framework_version_id"`
	RequirementID      string          `json:"requirementId" db:"requirement_id"`
	IntegrityStatus    IntegrityStatus `json:"integrityStatus" db:"integrity_status"`
	CreatedAt          time.Time       `json:"createdAt" db:"created_at"`
}

// EvidenceManifest represents a list of linked evidence records
type EvidenceManifest struct {
	ID             string    `json:"id" db:"id"`
	OrganizationID string    `json:"organizationId" db:"organization_id"`
	ManifestHash   string    `json:"manifestHash" db:"manifest_hash"`
	EvidenceIDs    []string  `json:"evidenceIds" db:"evidence_ids"`
	CreatedAt      time.Time `json:"createdAt" db:"created_at"`
}

// ValidationExecution tracks validation campaign runs
type ValidationExecution struct {
	ID             string     `json:"id" db:"id"`
	OrganizationID string     `json:"organizationId" db:"organization_id"`
	CampaignID     *string    `json:"campaignId,omitempty" db:"campaign_id"`
	Status         string     `json:"status" db:"status"` // running, complete, failed
	StartedAt      time.Time  `json:"startedAt" db:"started_at"`
	CompletedAt    *time.Time `json:"completedAt,omitempty" db:"completed_at"`
}

// ValidationResult represents individual validation suite checks
type ValidationResult struct {
	ID             string          `json:"id" db:"id"`
	OrganizationID string          `json:"organizationId" db:"organization_id"`
	ExecutionID    string          `json:"executionId" db:"execution_id"`
	TestSuite      string          `json:"testSuite" db:"test_suite"` // prompt_injection, etc.
	Passed         bool            `json:"passed" db:"passed"`
	Score          float64         `json:"score" db:"score"`
	Details        json.RawMessage `json:"details" db:"details"`
}

// ControlEvaluation represents evaluated controls status
type ControlEvaluation struct {
	ID              string    `json:"id" db:"id"`
	OrganizationID  string    `json:"organizationId" db:"organization_id"`
	ControlID       string    `json:"controlId" db:"control_id"`
	Status          string    `json:"status" db:"status"` // passed, failed, incomplete
	LastEvaluatedAt time.Time `json:"lastEvaluatedAt" db:"last_evaluated_at"`
}

// FindingDisposition tracks formal decision on security findings
type FindingDisposition struct {
	ID                string     `json:"id" db:"id"`
	OrganizationID    string     `json:"organizationId" db:"organization_id"`
	FindingID         string     `json:"findingId" db:"finding_id"`
	Disposition       string     `json:"disposition" db:"disposition"` // mitigated, accepted_risk, etc.
	Owner             string     `json:"owner" db:"owner"`
	Justification     string     `json:"justification" db:"justification"`
	Approver          string     `json:"approver" db:"approver"`
	ExpiresAt         *time.Time `json:"expiresAt,omitempty" db:"expires_at"`
	LinkedEvidenceID  *string    `json:"linkedEvidenceId,omitempty" db:"linked_evidence_id"`
	CreatedAt         time.Time  `json:"createdAt" db:"created_at"`
}

// AssuranceEvaluation is a computed assurance result
type AssuranceEvaluation struct {
	ID                  string           `json:"id" db:"id"`
	OrganizationID      string           `json:"organizationId" db:"organization_id"`
	FrameworkVersionID  string           `json:"frameworkVersionId" db:"framework_version_id"`
	SubjectSnapshotID   string           `json:"subjectSnapshotId" db:"subject_snapshot_id"`
	EvaluatedAt         time.Time        `json:"evaluatedAt" db:"evaluated_at"`
	EngineVersion       string           `json:"engineVersion" db:"engine_version"`
	Status              EvaluationStatus `json:"status" db:"status"`
	OverallScore        float64          `json:"overallScore" db:"overall_score"`
	Confidence          float64          `json:"confidence" db:"confidence"`
	ControlCoverage     float64          `json:"controlCoverage" db:"control_coverage"`
	EvidenceCoverage    float64          `json:"evidenceCoverage" db:"evidence_coverage"`
	ValidationPassRate  float64          `json:"validationPassRate" db:"validation_pass_rate"`
	CriticalFindingCount int              `json:"criticalFindingCount" db:"critical_finding_count"`
	HighFindingCount     int              `json:"highFindingCount" db:"high_finding_count"`
	UnmetRequirements   []string         `json:"unmetRequirements" db:"unmet_requirements"`
	AcceptedExceptions  []string         `json:"acceptedExceptions" db:"accepted_exceptions"`
	RevocationReasons   []string         `json:"revocationReasons" db:"revocation_reasons"`
	EvidenceManifestHash string          `json:"evidenceManifestHash" db:"evidence_manifest_hash"`
	SubjectFingerprint  string           `json:"subjectFingerprint" db:"subject_fingerprint"`
}

type PassportSignature struct {
	Algorithm   string `json:"algorithm"` // "Ed25519"
	KeyID       string `json:"keyId"`
	PayloadHash string `json:"payloadHash"`
	Signature   string `json:"signature"`
	SignedAt    string `json:"signedAt"`
}

type ScopeSummary struct {
	Agents      int `json:"agents"`
	Models      int `json:"models"`
	Tools       int `json:"tools"`
	MCPServers  int `json:"mcpServers"`
	DataStores  int `json:"dataStores"`
	Deployments int `json:"deployments"`
}

type ResultsSummary struct {
	ControlsPassed       int `json:"controlsPassed"`
	ControlsTotal        int `json:"controlsTotal"`
	ValidationsPassed    int `json:"validationsPassed"`
	ValidationsTotal     int `json:"validationsTotal"`
	OpenCriticalFindings int `json:"openCriticalFindings"`
	OpenHighFindings     int `json:"openHighFindings"`
}

type PassportException struct {
	ID                  string    `json:"id" db:"id"`
	PassportID          string    `json:"passportId" db:"passport_id"`
	RequirementID       string    `json:"requirementId" db:"requirement_id"`
	Justification       string    `json:"justification" db:"justification"`
	ApprovedBy          string    `json:"approvedBy" db:"approved_by"`
	ExpiresAt           time.Time `json:"expiresAt" db:"expires_at"`
	CompensatingControl string    `json:"compensatingControl" db:"compensating_control"`
	ResidualRisk        string    `json:"residualRisk" db:"residual_risk"`
}

// SecurityPassport is the cryptographically signed snapshot of evaluated security state
type SecurityPassport struct {
	PassportID             string            `json:"passportId" db:"passport_id"`
	PassportVersion        string            `json:"passportVersion" db:"passport_version"`
	OrganizationID         string            `json:"organizationId" db:"organization_id"`
	SystemID               string            `json:"systemId" db:"system_id"`
	SystemDisplayName      string            `json:"systemDisplayName" db:"system_display_name"`
	FrameworkID            string            `json:"frameworkId" db:"framework_id"`
	FrameworkVersionID     string            `json:"frameworkVersionId" db:"framework_version_id"`
	FrameworkFingerprint   string            `json:"frameworkFingerprint" db:"framework_fingerprint"`
	AssuranceEvaluationID  string            `json:"assuranceEvaluationId" db:"assurance_evaluation_id"`
	SubjectFingerprint     string            `json:"subjectFingerprint" db:"subject_fingerprint"`
	EvidenceManifestHash   string            `json:"evidenceManifestHash" db:"evidence_manifest_hash"`
	IssuedAt               time.Time         `json:"issuedAt" db:"issued_at"`
	ValidUntil             time.Time         `json:"validUntil" db:"valid_until"`
	Status                 PassportStatus    `json:"status" db:"status"`
	AssuranceLevel         AssuranceLevel    `json:"assuranceLevel" db:"assurance_level"`
	ScopeSummary           ScopeSummary      `json:"scopeSummary" db:"scope_summary"`
	ResultsSummary         ResultsSummary    `json:"resultsSummary" db:"results_summary"`
	Limitations            []string          `json:"limitations" db:"limitations"`
	Exceptions             []PassportException `json:"exceptions" db:"-"`
	Issuer                 map[string]interface{} `json:"issuer" db:"issuer"`
	Signature              PassportSignature `json:"signature" db:"signature"`
	PayloadHash            string            `json:"payloadHash" db:"payload_hash"`
}

// PassportStatusEvent tracks state transitions
type PassportStatusEvent struct {
	ID             string    `json:"id" db:"id"`
	PassportID     string    `json:"passportId" db:"passport_id"`
	Sequence       int       `json:"sequence" db:"sequence"`
	Status         string    `json:"status" db:"status"` // ISSUED, DEGRADED, SUSPENDED, REVOKED, EXPIRED, SUPERSEDED, REINSTATED
	Reason         string    `json:"reason,omitempty" db:"reason"`
	TransitionedBy string    `json:"transitionedBy" db:"transitioned_by"`
	TransitionedAt time.Time `json:"transitionedAt" db:"transitioned_at"`
}

// SigningKeyReference points to managed keys
type SigningKeyReference struct {
	ID        string    `json:"id" db:"id"`
	KeyID     string    `json:"keyId" db:"key_id"`
	Algorithm string    `json:"algorithm" db:"algorithm"`
	Provider  string    `json:"provider" db:"provider"`
	Status    string    `json:"status" db:"status"`
	CreatedAt time.Time `json:"createdAt" db:"created_at"`
}

// ExternalVerificationToken is a verification shareable link token
type ExternalVerificationToken struct {
	ID         string     `json:"id" db:"id"`
	PassportID string     `json:"passportId" db:"passport_id"`
	Token      string     `json:"token" db:"token"`
	ExpiresAt  *time.Time `json:"expiresAt,omitempty" db:"expires_at"`
	CreatedAt  time.Time  `json:"createdAt" db:"created_at"`
}
