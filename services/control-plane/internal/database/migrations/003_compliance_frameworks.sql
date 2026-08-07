-- ============================================================
-- 003: Compliance Frameworks & Control Mappings
-- ============================================================

-- Framework definitions
CREATE TABLE IF NOT EXISTS compliance_frameworks (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    version TEXT NOT NULL,
    jurisdiction TEXT NOT NULL,
    mandatory BOOLEAN DEFAULT false,
    description TEXT NOT NULL,
    effective_date DATE,
    penalty_description TEXT,
    controls JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Maps each test category to specific framework controls
CREATE TABLE IF NOT EXISTS framework_control_mappings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    test_category TEXT NOT NULL,
    framework_id TEXT NOT NULL REFERENCES compliance_frameworks(id) ON DELETE CASCADE,
    control_id TEXT NOT NULL,
    control_title TEXT NOT NULL,
    mapping_rationale TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'HIGH',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(test_category, framework_id, control_id)
);
CREATE INDEX IF NOT EXISTS idx_fcm_test_category ON framework_control_mappings(test_category);
CREATE INDEX IF NOT EXISTS idx_fcm_framework_id ON framework_control_mappings(framework_id);

-- ============================================================
-- Seed: EU AI Act (Mandatory, EU, Aug 2024)
-- ============================================================
INSERT INTO compliance_frameworks (id, name, version, jurisdiction, mandatory, description, effective_date, penalty_description, controls)
VALUES (
    'EU_AI_ACT',
    'EU Artificial Intelligence Act',
    '2024/1689',
    'European Union',
    true,
    'Risk-based regulation for AI systems placed on the EU market. Establishes mandatory requirements for high-risk AI including risk management, data governance, transparency, human oversight, and cybersecurity.',
    '2024-08-01',
    'Up to €35 million or 7% of total worldwide annual turnover',
    '[
        {"controlId": "EU-AIA-ART-9", "title": "Risk Management System", "description": "Establish, implement, document and maintain a risk management system throughout the AI lifecycle", "category": "governance"},
        {"controlId": "EU-AIA-ART-10", "title": "Data Governance", "description": "Training, validation and testing data sets shall be subject to appropriate data governance and management practices", "category": "data"},
        {"controlId": "EU-AIA-ART-11", "title": "Technical Documentation", "description": "Technical documentation shall be drawn up before the AI system is placed on the market and kept up to date", "category": "documentation"},
        {"controlId": "EU-AIA-ART-13", "title": "Transparency & User Information", "description": "High-risk AI systems shall be designed to ensure transparency and enable users to interpret output", "category": "transparency"},
        {"controlId": "EU-AIA-ART-14", "title": "Human Oversight", "description": "High-risk AI shall be designed to allow effective human oversight during use", "category": "oversight"},
        {"controlId": "EU-AIA-ART-15", "title": "Accuracy, Robustness & Cybersecurity", "description": "High-risk AI shall achieve appropriate levels of accuracy, robustness and cybersecurity, and perform consistently", "category": "security"}
    ]'::jsonb
) ON CONFLICT (id) DO UPDATE SET controls = EXCLUDED.controls, description = EXCLUDED.description;

-- ============================================================
-- Seed: ISO/IEC 42001 (Certifiable AI Management System)
-- ============================================================
INSERT INTO compliance_frameworks (id, name, version, jurisdiction, mandatory, description, effective_date, penalty_description, controls)
VALUES (
    'ISO_42001',
    'ISO/IEC 42001 AI Management System',
    '2023',
    'International',
    false,
    'International standard for establishing, implementing, maintaining and continually improving an AI management system (AIMS). Provides a certifiable governance framework for responsible AI.',
    '2023-12-18',
    'Not directly penalized but increasingly required by enterprise procurement and regulatory bodies',
    '[
        {"controlId": "ISO42001-A.2", "title": "AI Risk Assessment", "description": "The organization shall conduct risk assessments for AI systems considering potential adverse impacts", "category": "risk"},
        {"controlId": "ISO42001-A.3", "title": "Transparency & Explainability", "description": "Ensure AI system decisions can be understood and explained to relevant stakeholders", "category": "transparency"},
        {"controlId": "ISO42001-A.5", "title": "Data Management for AI", "description": "Establish data management practices covering quality, bias, privacy and representativeness", "category": "data"},
        {"controlId": "ISO42001-A.6", "title": "AI System Lifecycle", "description": "Manage the AI system throughout its lifecycle including design, development, deployment, and decommissioning", "category": "lifecycle"},
        {"controlId": "ISO42001-A.8", "title": "AI System Security", "description": "Implement security controls specific to AI including adversarial robustness and model integrity", "category": "security"},
        {"controlId": "ISO42001-A.10", "title": "Third-Party AI Components", "description": "Assess and manage risks from third-party AI models, datasets, and components in the supply chain", "category": "supply_chain"}
    ]'::jsonb
) ON CONFLICT (id) DO UPDATE SET controls = EXCLUDED.controls, description = EXCLUDED.description;

-- ============================================================
-- Seed: NIST AI RMF (US De Facto Standard)
-- ============================================================
INSERT INTO compliance_frameworks (id, name, version, jurisdiction, mandatory, description, effective_date, penalty_description, controls)
VALUES (
    'NIST_AI_RMF',
    'NIST AI Risk Management Framework',
    '1.0',
    'United States',
    false,
    'Voluntary risk management framework for trustworthy AI. De facto mandatory for US federal contractors. Four core functions: Govern, Map, Measure, Manage.',
    '2023-01-26',
    'Not directly penalized but referenced by FTC, SEC, and federal procurement as benchmark for reasonable AI governance',
    '[
        {"controlId": "NIST-GOVERN-1", "title": "Organizational Governance", "description": "Policies, processes, and accountability structures for AI risk management are in place", "category": "governance"},
        {"controlId": "NIST-MAP-1", "title": "Context & Risk Identification", "description": "AI system context is established and potential risks are identified across the lifecycle", "category": "risk"},
        {"controlId": "NIST-MAP-3.4", "title": "AI Risk Mapping - Security", "description": "Identify and document risks related to AI system security including adversarial attacks", "category": "security"},
        {"controlId": "NIST-MEASURE-2.6", "title": "AI Measurement - Robustness", "description": "Measure AI system robustness against adversarial inputs and distribution shifts", "category": "measurement"},
        {"controlId": "NIST-MEASURE-2.7", "title": "AI Measurement - Safety", "description": "Evaluate AI system safety including output reliability and failure mode analysis", "category": "measurement"},
        {"controlId": "NIST-MANAGE-2.4", "title": "AI Risk Treatment", "description": "Implement risk treatment measures including controls, mitigations, and monitoring", "category": "management"}
    ]'::jsonb
) ON CONFLICT (id) DO UPDATE SET controls = EXCLUDED.controls, description = EXCLUDED.description;

-- ============================================================
-- Seed: OWASP LLM Top 10 (Technical Security Baseline)
-- ============================================================
INSERT INTO compliance_frameworks (id, name, version, jurisdiction, mandatory, description, effective_date, penalty_description, controls)
VALUES (
    'OWASP_LLM_TOP10',
    'OWASP Top 10 for LLM Applications',
    '2025',
    'Global',
    false,
    'Community-driven catalog of the most critical security risks for LLM-based applications. Industry standard for AI security testing and red teaming.',
    '2025-01-01',
    'Not a regulation but the industry-standard technical baseline referenced by auditors and regulators',
    '[
        {"controlId": "LLM01", "title": "Prompt Injection", "description": "Manipulating LLMs through crafted inputs to override instructions, access unauthorized data, or trigger unintended actions", "category": "injection", "severity": "CRITICAL"},
        {"controlId": "LLM02", "title": "Insecure Output Handling", "description": "Failing to validate or sanitize LLM outputs before passing to downstream systems", "category": "output", "severity": "HIGH"},
        {"controlId": "LLM03", "title": "Training Data Poisoning", "description": "Manipulating training data to introduce vulnerabilities, biases, or backdoors", "category": "data", "severity": "HIGH"},
        {"controlId": "LLM04", "title": "Model Denial of Service", "description": "Consuming excessive resources through crafted inputs causing service degradation", "category": "availability", "severity": "MEDIUM"},
        {"controlId": "LLM05", "title": "Supply Chain Vulnerabilities", "description": "Risks from compromised third-party models, training data, or deployment platforms", "category": "supply_chain", "severity": "HIGH"},
        {"controlId": "LLM06", "title": "Sensitive Information Disclosure", "description": "LLM revealing confidential data, PII, or proprietary information in responses", "category": "data_leak", "severity": "CRITICAL"},
        {"controlId": "LLM07", "title": "Insecure Plugin/Tool Design", "description": "Inadequate access controls, input validation, or sandboxing for LLM tools and plugins", "category": "tool_security", "severity": "CRITICAL"},
        {"controlId": "LLM08", "title": "Excessive Agency", "description": "Granting LLMs excessive permissions, autonomy, or ability to take impactful actions without oversight", "category": "agency", "severity": "HIGH"},
        {"controlId": "LLM09", "title": "Overreliance", "description": "Excessive trust in LLM outputs without verification, leading to misinformation or errors", "category": "trust", "severity": "MEDIUM"},
        {"controlId": "LLM10", "title": "Model Theft", "description": "Unauthorized access to or extraction of proprietary LLM models through queries or system access", "category": "theft", "severity": "HIGH"}
    ]'::jsonb
) ON CONFLICT (id) DO UPDATE SET controls = EXCLUDED.controls, description = EXCLUDED.description;

-- ============================================================
-- Seed: Test-to-Framework Control Mappings
-- ============================================================
-- Each assessment test_category maps to controls across ALL four frameworks

-- Prompt Injection tests
INSERT INTO framework_control_mappings (test_category, framework_id, control_id, control_title, mapping_rationale, severity) VALUES
('prompt_injection', 'OWASP_LLM_TOP10', 'LLM01', 'Prompt Injection', 'Direct test of prompt injection resistance', 'CRITICAL'),
('prompt_injection', 'EU_AI_ACT', 'EU-AIA-ART-15', 'Accuracy, Robustness & Cybersecurity', 'Prompt injection is an adversarial robustness attack against AI system integrity', 'CRITICAL'),
('prompt_injection', 'ISO_42001', 'ISO42001-A.8', 'AI System Security', 'Adversarial robustness is a core AI security control', 'CRITICAL'),
('prompt_injection', 'NIST_AI_RMF', 'NIST-MEASURE-2.6', 'AI Measurement - Robustness', 'Measures robustness against adversarial prompt manipulation', 'CRITICAL')
ON CONFLICT DO NOTHING;

-- Tool/Plugin boundary enforcement
INSERT INTO framework_control_mappings (test_category, framework_id, control_id, control_title, mapping_rationale, severity) VALUES
('tool_misuse', 'OWASP_LLM_TOP10', 'LLM07', 'Insecure Plugin/Tool Design', 'Tests tool access controls and input validation', 'CRITICAL'),
('tool_misuse', 'EU_AI_ACT', 'EU-AIA-ART-15', 'Accuracy, Robustness & Cybersecurity', 'Tool boundary enforcement is a cybersecurity control', 'HIGH'),
('tool_misuse', 'ISO_42001', 'ISO42001-A.8', 'AI System Security', 'Tool sandboxing is an AI-specific security control', 'HIGH'),
('tool_misuse', 'NIST_AI_RMF', 'NIST-MANAGE-2.4', 'AI Risk Treatment', 'Tool boundary enforcement is a risk treatment measure', 'HIGH')
ON CONFLICT DO NOTHING;

-- Data exfiltration prevention
INSERT INTO framework_control_mappings (test_category, framework_id, control_id, control_title, mapping_rationale, severity) VALUES
('data_exfiltration', 'OWASP_LLM_TOP10', 'LLM06', 'Sensitive Information Disclosure', 'Tests data leak prevention in LLM responses', 'CRITICAL'),
('data_exfiltration', 'EU_AI_ACT', 'EU-AIA-ART-10', 'Data Governance', 'Data governance requires preventing unauthorized data exposure', 'HIGH'),
('data_exfiltration', 'ISO_42001', 'ISO42001-A.5', 'Data Management for AI', 'Data management includes preventing data leaks through AI systems', 'HIGH'),
('data_exfiltration', 'NIST_AI_RMF', 'NIST-MAP-3.4', 'AI Risk Mapping - Security', 'Maps security risks related to sensitive data exposure', 'HIGH')
ON CONFLICT DO NOTHING;

-- Privilege escalation
INSERT INTO framework_control_mappings (test_category, framework_id, control_id, control_title, mapping_rationale, severity) VALUES
('privilege_escalation', 'OWASP_LLM_TOP10', 'LLM08', 'Excessive Agency', 'Tests that AI cannot escalate beyond granted permissions', 'HIGH'),
('privilege_escalation', 'EU_AI_ACT', 'EU-AIA-ART-14', 'Human Oversight', 'Human oversight requires that AI cannot override access boundaries', 'HIGH'),
('privilege_escalation', 'ISO_42001', 'ISO42001-A.3', 'Transparency & Explainability', 'Privilege escalation violates transparency of AI capabilities', 'HIGH'),
('privilege_escalation', 'NIST_AI_RMF', 'NIST-GOVERN-1', 'Organizational Governance', 'Governance requires proper access control enforcement', 'HIGH')
ON CONFLICT DO NOTHING;

-- Output handling / sanitization
INSERT INTO framework_control_mappings (test_category, framework_id, control_id, control_title, mapping_rationale, severity) VALUES
('output_handling', 'OWASP_LLM_TOP10', 'LLM02', 'Insecure Output Handling', 'Tests output sanitization before downstream consumption', 'HIGH'),
('output_handling', 'EU_AI_ACT', 'EU-AIA-ART-13', 'Transparency & User Information', 'Output transparency requires proper formatting and sanitization', 'MEDIUM'),
('output_handling', 'ISO_42001', 'ISO42001-A.3', 'Transparency & Explainability', 'Outputs must be understandable and safe for consumption', 'MEDIUM'),
('output_handling', 'NIST_AI_RMF', 'NIST-MEASURE-2.7', 'AI Measurement - Safety', 'Evaluates safety of AI system outputs', 'MEDIUM')
ON CONFLICT DO NOTHING;

-- Credential exposure
INSERT INTO framework_control_mappings (test_category, framework_id, control_id, control_title, mapping_rationale, severity) VALUES
('credential_exposure', 'OWASP_LLM_TOP10', 'LLM06', 'Sensitive Information Disclosure', 'Tests prevention of credential leaks in AI responses', 'CRITICAL'),
('credential_exposure', 'EU_AI_ACT', 'EU-AIA-ART-15', 'Accuracy, Robustness & Cybersecurity', 'Credential protection is a core cybersecurity requirement', 'CRITICAL'),
('credential_exposure', 'ISO_42001', 'ISO42001-A.8', 'AI System Security', 'Credential protection is an AI security control', 'CRITICAL'),
('credential_exposure', 'NIST_AI_RMF', 'NIST-MANAGE-2.4', 'AI Risk Treatment', 'Credential protection is a risk treatment control', 'CRITICAL')
ON CONFLICT DO NOTHING;

-- MCP boundary violations
INSERT INTO framework_control_mappings (test_category, framework_id, control_id, control_title, mapping_rationale, severity) VALUES
('mcp_boundary', 'OWASP_LLM_TOP10', 'LLM07', 'Insecure Plugin/Tool Design', 'MCP servers are a form of plugin architecture requiring sandboxing', 'CRITICAL'),
('mcp_boundary', 'EU_AI_ACT', 'EU-AIA-ART-15', 'Accuracy, Robustness & Cybersecurity', 'MCP boundary enforcement is a cybersecurity control for AI systems', 'HIGH'),
('mcp_boundary', 'ISO_42001', 'ISO42001-A.10', 'Third-Party AI Components', 'MCP servers are third-party components requiring supply chain risk management', 'HIGH'),
('mcp_boundary', 'NIST_AI_RMF', 'NIST-MAP-3.4', 'AI Risk Mapping - Security', 'MCP boundary risks must be mapped and managed', 'HIGH')
ON CONFLICT DO NOTHING;

-- Supply chain / model integrity
INSERT INTO framework_control_mappings (test_category, framework_id, control_id, control_title, mapping_rationale, severity) VALUES
('supply_chain', 'OWASP_LLM_TOP10', 'LLM05', 'Supply Chain Vulnerabilities', 'Tests integrity of third-party model and component supply chain', 'HIGH'),
('supply_chain', 'EU_AI_ACT', 'EU-AIA-ART-9', 'Risk Management System', 'Supply chain risks must be part of the risk management system', 'HIGH'),
('supply_chain', 'ISO_42001', 'ISO42001-A.10', 'Third-Party AI Components', 'Third-party component assessment is a core ISO 42001 control', 'HIGH'),
('supply_chain', 'NIST_AI_RMF', 'NIST-MAP-1', 'Context & Risk Identification', 'Supply chain context must be identified and assessed', 'HIGH')
ON CONFLICT DO NOTHING;
