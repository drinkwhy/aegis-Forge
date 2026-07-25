-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tenants
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Workspaces (belong to tenant)
CREATE TABLE workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, slug)
);

-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    auth0_sub TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member', -- owner, admin, member, viewer
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RoE Documents
CREATE TABLE roe_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    workspace_id UUID NOT NULL REFERENCES workspaces(id),
    roe_json JSONB NOT NULL,
    signature TEXT NOT NULL, -- Ed25519 signature
    signed_by UUID NOT NULL REFERENCES users(id),
    signed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    valid_from TIMESTAMPTZ NOT NULL,
    valid_until TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- RoE Violations (insert-only)
CREATE TABLE roe_violations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    roe_id UUID NOT NULL REFERENCES roe_documents(id),
    campaign_id UUID,
    violation_type TEXT NOT NULL, -- out_of_scope_target, expired_window, prohibited_action
    attempted_action JSONB NOT NULL,
    blocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Prevent updates/deletes on violations
CREATE RULE roe_violations_no_update AS ON UPDATE TO roe_violations DO INSTEAD NOTHING;
CREATE RULE roe_violations_no_delete AS ON DELETE TO roe_violations DO INSTEAD NOTHING;

-- Campaigns
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    workspace_id UUID NOT NULL REFERENCES workspaces(id),
    roe_id UUID NOT NULL REFERENCES roe_documents(id),
    name TEXT NOT NULL,
    target_agent_id TEXT, -- Neo4j node ID
    status TEXT NOT NULL DEFAULT 'pending', -- pending, planning, executing, analyzing, complete, failed
    attack_classes TEXT[] NOT NULL DEFAULT '{}',
    total_tests INT NOT NULL DEFAULT 0,
    tests_run INT NOT NULL DEFAULT 0,
    findings_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

-- Campaign Runs (individual test execution)
CREATE TABLE campaign_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    corpus_entry_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'queued', -- queued, running, success, failure, error
    sandbox_id TEXT,
    payload_used JSONB,
    detector_results JSONB,
    evidence_refs TEXT[],
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

-- Findings
CREATE TABLE findings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    workspace_id UUID NOT NULL REFERENCES workspaces(id),
    campaign_id UUID NOT NULL REFERENCES campaigns(id),
    run_id UUID REFERENCES campaign_runs(id),
    title TEXT NOT NULL,
    vulnerability_class TEXT NOT NULL, -- e.g., LLM01
    owasp_category TEXT NOT NULL,
    mitre_atlas_id TEXT,
    severity TEXT NOT NULL, -- critical, high, medium, low
    status TEXT NOT NULL DEFAULT 'open', -- open, remediated, accepted_risk, false_positive
    attack_path JSONB, -- graph traversal result
    evidence JSONB NOT NULL,
    fair_score JSONB, -- FAIR-AI financial risk range
    blast_radius JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    remediated_at TIMESTAMPTZ
);

-- Remediations
CREATE TABLE remediations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    finding_id UUID NOT NULL REFERENCES findings(id),
    fix_type TEXT NOT NULL, -- code_patch, system_prompt, policy_update, config_change
    proposed_fix JSONB NOT NULL,
    pr_url TEXT,
    status TEXT NOT NULL DEFAULT 'proposed', -- proposed, approved, rejected, merged, validated
    proposed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    validated_at TIMESTAMPTZ
);

-- Audit Log (append-only)
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    actor_id UUID,
    actor_type TEXT NOT NULL, -- user, agent, system
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id UUID,
    metadata JSONB,
    ip_address INET,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
) PARTITION BY RANGE (occurred_at);

CREATE TABLE audit_log_2026 PARTITION OF audit_log
    FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');

CREATE RULE audit_log_no_update AS ON UPDATE TO audit_log DO INSTEAD NOTHING;
CREATE RULE audit_log_no_delete AS ON DELETE TO audit_log DO INSTEAD NOTHING;

-- Row Level Security
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE remediations ENABLE ROW LEVEL SECURITY;
ALTER TABLE roe_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON workspaces
    USING (tenant_id::text = current_setting('app.current_tenant_id', true));
CREATE POLICY tenant_isolation ON campaigns
    USING (tenant_id::text = current_setting('app.current_tenant_id', true));
CREATE POLICY tenant_isolation ON findings
    USING (tenant_id::text = current_setting('app.current_tenant_id', true));
CREATE POLICY tenant_isolation ON remediations
    USING (tenant_id::text = current_setting('app.current_tenant_id', true));
CREATE POLICY tenant_isolation ON roe_documents
    USING (tenant_id::text = current_setting('app.current_tenant_id', true));

-- Indexes
CREATE INDEX idx_campaigns_workspace ON campaigns(workspace_id, status);
CREATE INDEX idx_findings_workspace ON findings(workspace_id, severity, status);
CREATE INDEX idx_audit_log_tenant ON audit_log(tenant_id, occurred_at DESC);
CREATE INDEX idx_roe_violations_roe ON roe_violations(roe_id, blocked_at DESC);
