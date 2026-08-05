-- AI Systems Registry
-- Tracks every registered AI system as a living trust record
CREATE TABLE IF NOT EXISTS ai_systems (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    display_name TEXT NOT NULL,
    purpose TEXT,
    owner TEXT,
    model_provider TEXT,
    model_name TEXT,
    version TEXT DEFAULT '1.0.0',
    environment TEXT DEFAULT 'production', -- development, staging, production
    status TEXT DEFAULT 'active', -- active, inactive, decommissioned
    tags TEXT[] DEFAULT '{}',
    connected_tools JSONB DEFAULT '[]',
    connected_mcp_servers JSONB DEFAULT '[]',
    connected_apis JSONB DEFAULT '[]',
    connected_databases JSONB DEFAULT '[]',
    permissions JSONB DEFAULT '{}',
    data_classifications TEXT[] DEFAULT '{}',
    trust_score NUMERIC(5,2) DEFAULT 100.0,
    trust_trend TEXT DEFAULT 'stable', -- improving, stable, degrading
    risk_level TEXT DEFAULT 'low', -- low, medium, high, critical
    last_event_at TIMESTAMPTZ,
    passport_id TEXT,
    metadata JSONB DEFAULT '{}',
    registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_systems_org ON ai_systems(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_systems_status ON ai_systems(status);
CREATE INDEX IF NOT EXISTS idx_ai_systems_trust ON ai_systems(trust_score);

-- Runtime Events
-- Continuous stream of AI system runtime observations
CREATE TABLE IF NOT EXISTS runtime_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    system_id UUID REFERENCES ai_systems(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- tool_call, api_call, db_query, policy_violation, drift_detected, credential_use, human_approval, prompt_injection_attempt, sensitive_data_access
    severity TEXT NOT NULL DEFAULT 'info', -- info, low, medium, high, critical
    actor TEXT, -- which agent/model triggered this
    action TEXT NOT NULL,
    resource TEXT,
    outcome TEXT NOT NULL DEFAULT 'allowed', -- allowed, blocked, flagged, escalated
    metadata JSONB DEFAULT '{}',
    raw_payload JSONB DEFAULT '{}',
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ingested_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_runtime_events_system ON runtime_events(system_id);
CREATE INDEX IF NOT EXISTS idx_runtime_events_org ON runtime_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_runtime_events_type ON runtime_events(event_type);
CREATE INDEX IF NOT EXISTS idx_runtime_events_occurred ON runtime_events(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_runtime_events_severity ON runtime_events(severity);

-- Trust Score History
-- Tracks trust score changes over time for trend analysis
CREATE TABLE IF NOT EXISTS trust_score_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    system_id UUID NOT NULL REFERENCES ai_systems(id) ON DELETE CASCADE,
    score NUMERIC(5,2) NOT NULL,
    reason TEXT,
    passport_status TEXT,
    open_critical_findings INT DEFAULT 0,
    open_high_findings INT DEFAULT 0,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trust_history_system ON trust_score_history(system_id, recorded_at DESC);

-- Seed default AI system for demo org if not exists
INSERT INTO ai_systems (
    organization_id, name, display_name, purpose, owner,
    model_provider, model_name, version, environment,
    connected_tools, connected_mcp_servers, connected_databases,
    data_classifications, trust_score, trust_trend, risk_level, tags
)
SELECT
    'd3b07384-d113-4a11-b541-ef81f212239e',
    'enterprise-financial-advisor',
    'Enterprise Financial Advisor Agent',
    'Provides AI-driven financial analysis and reporting for enterprise clients',
    'Platform Engineering',
    'Anthropic',
    'claude-3-5-sonnet',
    '2.1.0',
    'production',
    '[{"name":"SQL Query Tool","type":"database","status":"active"},{"name":"Document Reader","type":"file","status":"active"},{"name":"Calculator","type":"compute","status":"active"}]'::jsonb,
    '[{"name":"Financial MCP Server","protocol":"MCP/1.0","status":"active"}]'::jsonb,
    '[{"name":"PostgreSQL Financial DB","type":"postgresql","classification":"PII"}]'::jsonb,
    ARRAY['PII','Financial','Confidential'],
    96.5,
    'stable',
    'low',
    ARRAY['production','finance','llm']
WHERE NOT EXISTS (
    SELECT 1 FROM ai_systems
    WHERE organization_id = 'd3b07384-d113-4a11-b541-ef81f212239e'
    AND name = 'enterprise-financial-advisor'
);

-- Seed runtime events for the demo system
INSERT INTO runtime_events (organization_id, system_id, event_type, severity, actor, action, resource, outcome, metadata, occurred_at)
SELECT
    'd3b07384-d113-4a11-b541-ef81f212239e',
    s.id,
    unnest(ARRAY['tool_call','tool_call','api_call','policy_violation','tool_call','sensitive_data_access','human_approval','tool_call']),
    unnest(ARRAY['info','info','info','high','info','medium','info','info']),
    'enterprise-financial-advisor',
    unnest(ARRAY['execute_sql','read_document','call_external_api','bypass_policy','execute_sql','access_pii','request_approval','calculate']),
    unnest(ARRAY['financial_db','Q4_Report.pdf','reporting-api','system_prompt_override','customer_records','SSN_field','human_reviewer','aggregate_fn']),
    unnest(ARRAY['allowed','allowed','allowed','blocked','allowed','flagged','allowed','allowed']),
    '{}'::jsonb,
    NOW() - (unnest(ARRAY[1,3,6,8,12,15,20,24]) * interval '1 hour')
FROM ai_systems s
WHERE s.organization_id = 'd3b07384-d113-4a11-b541-ef81f212239e'
AND s.name = 'enterprise-financial-advisor'
AND NOT EXISTS (
    SELECT 1 FROM runtime_events re WHERE re.system_id = s.id
)
LIMIT 1;
