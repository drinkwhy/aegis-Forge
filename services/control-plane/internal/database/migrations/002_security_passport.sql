-- Subject Snapshots
CREATE TABLE IF NOT EXISTS subject_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    system_id TEXT NOT NULL,
    subject_fingerprint TEXT NOT NULL,
    snapshot_data JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_subject_snapshots_fingerprint ON subject_snapshots(subject_fingerprint);

-- Evidence Artifacts
CREATE TABLE IF NOT EXISTS evidence_artifacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    evidence_type TEXT NOT NULL, -- VALIDATION_RESULT, CONFIGURATION_SNAPSHOT, CONTROL_TELEMETRY, MANUAL_REVIEW, CODE_ATTESTATION, DEPLOYMENT_ATTESTATION, AUDIT_LOG_EXTRACT
    subject_type TEXT NOT NULL, -- SYSTEM, AGENT, MODEL, TOOL, MCP_SERVER, DEPLOYMENT
    subject_id TEXT NOT NULL,
    source_system TEXT NOT NULL,
    source_record_id TEXT,
    captured_at TIMESTAMPTZ NOT NULL,
    valid_from TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ,
    content_hash TEXT NOT NULL,
    storage_uri TEXT NOT NULL,
    schema_version TEXT NOT NULL,
    collector_identity TEXT NOT NULL,
    reviewer_identity TEXT,
    review_status TEXT NOT NULL DEFAULT 'UNREVIEWED', -- UNREVIEWED, ACCEPTED, REJECTED
    framework_id TEXT NOT NULL,
    framework_version_id TEXT NOT NULL,
    requirement_id TEXT NOT NULL,
    integrity_status TEXT NOT NULL DEFAULT 'UNKNOWN', -- VERIFIED, FAILED, UNKNOWN
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_evidence_artifacts_hash ON evidence_artifacts(content_hash);

-- Evidence Manifests
CREATE TABLE IF NOT EXISTS evidence_manifests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    manifest_hash TEXT UNIQUE NOT NULL,
    evidence_ids UUID[] NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_evidence_manifests_hash ON evidence_manifests(manifest_hash);

-- Validation Executions
CREATE TABLE IF NOT EXISTS validation_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
    status TEXT NOT NULL, -- running, complete, failed
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Validation Results
CREATE TABLE IF NOT EXISTS validation_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    execution_id UUID NOT NULL REFERENCES validation_executions(id) ON DELETE CASCADE,
    test_suite TEXT NOT NULL, -- prompt_injection, tool_misuse, data_exfiltration, privilege_escalation, credential_exposure, memory_poisoning, mcp_boundary_violations
    passed BOOLEAN NOT NULL,
    score NUMERIC NOT NULL,
    details JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Control Evaluations
CREATE TABLE IF NOT EXISTS control_evaluations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    control_id TEXT NOT NULL,
    status TEXT NOT NULL, -- passed, failed, incomplete
    last_evaluated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Finding Dispositions
CREATE TABLE IF NOT EXISTS finding_dispositions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    finding_id UUID NOT NULL REFERENCES findings(id) ON DELETE CASCADE,
    disposition TEXT NOT NULL, -- open, fixed, mitigated, accepted_risk, false_positive, expired_exception, compensating_control
    owner TEXT NOT NULL,
    justification TEXT NOT NULL,
    approver TEXT NOT NULL,
    expires_at TIMESTAMPTZ,
    linked_evidence_id UUID REFERENCES evidence_artifacts(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Assurance Evaluations
CREATE TABLE IF NOT EXISTS assurance_evaluations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    framework_version_id TEXT NOT NULL,
    subject_snapshot_id UUID NOT NULL REFERENCES subject_snapshots(id) ON DELETE RESTRICT,
    evaluated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    engine_version TEXT NOT NULL,
    status TEXT NOT NULL, -- NOT_ASSESSED, INCOMPLETE, CONDITIONALLY_READY, READY, DEGRADED, REVOKED, EXPIRED
    overall_score NUMERIC NOT NULL,
    confidence NUMERIC NOT NULL,
    control_coverage NUMERIC NOT NULL,
    evidence_coverage NUMERIC NOT NULL,
    validation_pass_rate NUMERIC NOT NULL,
    critical_finding_count INT NOT NULL,
    high_finding_count INT NOT NULL,
    unmet_requirements TEXT[] NOT NULL DEFAULT '{}'::text[],
    accepted_exceptions TEXT[] NOT NULL DEFAULT '{}'::text[],
    revocation_reasons TEXT[] NOT NULL DEFAULT '{}'::text[],
    evidence_manifest_hash TEXT NOT NULL,
    subject_fingerprint TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_assurance_evals_framework ON assurance_evaluations(framework_version_id);

-- Security Passports
CREATE TABLE IF NOT EXISTS security_passports (
    passport_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    passport_version TEXT NOT NULL DEFAULT '1.0',
    organization_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    system_id TEXT NOT NULL,
    system_display_name TEXT NOT NULL,
    framework_id TEXT NOT NULL,
    framework_version_id TEXT NOT NULL,
    framework_fingerprint TEXT NOT NULL,
    assurance_evaluation_id UUID NOT NULL REFERENCES assurance_evaluations(id) ON DELETE RESTRICT,
    subject_fingerprint TEXT NOT NULL,
    evidence_manifest_hash TEXT NOT NULL,
    issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    valid_until TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL, -- VALID, DEGRADED, SUSPENDED, REVOKED, EXPIRED
    assurance_level TEXT NOT NULL, -- OBSERVED, TESTED, VERIFIED, CONTINUOUSLY_VERIFIED
    scope_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
    results_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
    limitations TEXT[] NOT NULL DEFAULT '{}'::text[],
    issuer JSONB NOT NULL DEFAULT '{}'::jsonb,
    signature JSONB NOT NULL DEFAULT '{}'::jsonb,
    payload_hash TEXT UNIQUE NOT NULL
);

-- Passport Exceptions
CREATE TABLE IF NOT EXISTS passport_exceptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    passport_id UUID NOT NULL REFERENCES security_passports(passport_id) ON DELETE CASCADE,
    requirement_id TEXT NOT NULL,
    justification TEXT NOT NULL,
    approved_by TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    compensating_control TEXT NOT NULL,
    residual_risk TEXT NOT NULL
);

-- Passport Status Events
CREATE TABLE IF NOT EXISTS passport_status_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    passport_id UUID NOT NULL REFERENCES security_passports(passport_id) ON DELETE CASCADE,
    sequence INT NOT NULL,
    status TEXT NOT NULL, -- ISSUED, DEGRADED, SUSPENDED, REVOKED, EXPIRED, SUPERSEDED, REINSTATED
    reason TEXT,
    transitioned_by TEXT NOT NULL,
    transitioned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_passport_status_seq UNIQUE(passport_id, sequence)
);

-- Signing Key References
CREATE TABLE IF NOT EXISTS signing_key_references (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key_id TEXT UNIQUE NOT NULL,
    algorithm TEXT NOT NULL DEFAULT 'Ed25519',
    provider TEXT NOT NULL, -- vault, kms, local
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- External Verification Tokens
CREATE TABLE IF NOT EXISTS external_verification_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    passport_id UUID NOT NULL REFERENCES security_passports(passport_id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE subject_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_manifests ENABLE ROW LEVEL SECURITY;
ALTER TABLE validation_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE validation_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE control_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE finding_dispositions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assurance_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_passports ENABLE ROW LEVEL SECURITY;
ALTER TABLE passport_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE passport_status_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON subject_snapshots USING (organization_id::text = current_setting('app.current_tenant_id', true));
CREATE POLICY tenant_isolation ON evidence_artifacts USING (organization_id::text = current_setting('app.current_tenant_id', true));
CREATE POLICY tenant_isolation ON evidence_manifests USING (organization_id::text = current_setting('app.current_tenant_id', true));
CREATE POLICY tenant_isolation ON validation_executions USING (organization_id::text = current_setting('app.current_tenant_id', true));
CREATE POLICY tenant_isolation ON validation_results USING (organization_id::text = current_setting('app.current_tenant_id', true));
CREATE POLICY tenant_isolation ON control_evaluations USING (organization_id::text = current_setting('app.current_tenant_id', true));
CREATE POLICY tenant_isolation ON finding_dispositions USING (organization_id::text = current_setting('app.current_tenant_id', true));
CREATE POLICY tenant_isolation ON assurance_evaluations USING (organization_id::text = current_setting('app.current_tenant_id', true));
CREATE POLICY tenant_isolation ON security_passports USING (organization_id::text = current_setting('app.current_tenant_id', true));
CREATE POLICY tenant_isolation ON passport_exceptions USING (passport_id IN (SELECT passport_id FROM security_passports));
CREATE POLICY tenant_isolation ON passport_status_events USING (passport_id IN (SELECT passport_id FROM security_passports));
