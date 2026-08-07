-- organizations table (customer-owned orgs, separate from tenants)
CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id text NOT NULL,  -- Clerk user ID (clerkUserId)
  display_name text NOT NULL,
  slug text UNIQUE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS organizations_owner_user_id_idx ON organizations(owner_user_id);

-- organization_members (for future multi-user support)
CREATE TABLE IF NOT EXISTS organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id text NOT NULL,  -- Clerk user ID
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner','admin','reviewer','member')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

-- assets (AI systems registered for assessment)
CREATE TABLE IF NOT EXISTS assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  owner_user_id text NOT NULL,
  name text NOT NULL,
  description text,
  asset_type text NOT NULL CHECK (asset_type IN ('openai_compatible','mcp_server')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS assets_organization_id_idx ON assets(organization_id);

-- audit_orders
CREATE TABLE IF NOT EXISTS audit_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  purchaser_user_id text NOT NULL,
  asset_id uuid NOT NULL REFERENCES assets(id) ON DELETE RESTRICT,
  product_code text NOT NULL DEFAULT 'AEGIS_VERIFIED_LAUNCH_ASSESSMENT',
  status text NOT NULL DEFAULT 'DRAFT' CHECK (status IN (
    'DRAFT','PAYMENT_PENDING','PAID','INTAKE_REQUIRED','READY',
    'ASSESSMENT_RUNNING','REVIEW_REQUIRED','REMEDIATION_REQUIRED',
    'COMPLETED','CANCELED','REFUNDED'
  )),
  amount integer NOT NULL DEFAULT 0,  -- in cents
  currency text NOT NULL DEFAULT 'usd',
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_orders_organization_id_idx ON audit_orders(organization_id);
CREATE INDEX IF NOT EXISTS audit_orders_purchaser_user_id_idx ON audit_orders(purchaser_user_id);
CREATE UNIQUE INDEX IF NOT EXISTS audit_orders_stripe_checkout_session_id_idx 
  ON audit_orders(stripe_checkout_session_id) WHERE stripe_checkout_session_id IS NOT NULL;

-- audit_targets
CREATE TABLE IF NOT EXISTS audit_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  audit_order_id uuid NOT NULL REFERENCES audit_orders(id) ON DELETE RESTRICT,
  asset_id uuid NOT NULL REFERENCES assets(id) ON DELETE RESTRICT,
  target_type text NOT NULL CHECK (target_type IN ('openai_compatible','mcp_server')),
  endpoint text NOT NULL,
  authentication_reference text,  -- Vault path or secrets manager ARN, NEVER plaintext
  environment text NOT NULL DEFAULT 'production' CHECK (environment IN ('production','staging','development')),
  ownership_confirmed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_targets_audit_order_id_idx ON audit_targets(audit_order_id);

-- rules_of_engagement
CREATE TABLE IF NOT EXISTS rules_of_engagement (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  audit_order_id uuid NOT NULL REFERENCES audit_orders(id) ON DELETE RESTRICT,
  target_id uuid NOT NULL REFERENCES audit_targets(id) ON DELETE RESTRICT,
  authorized_domains text[] NOT NULL DEFAULT '{}',
  authorized_endpoints text[] NOT NULL DEFAULT '{}',
  permitted_tests text[] NOT NULL DEFAULT '{}',
  prohibited_actions text[] NOT NULL DEFAULT '{}',
  rate_limit integer NOT NULL DEFAULT 10,  -- requests per minute
  testing_window_start timestamptz,
  testing_window_end timestamptz,
  emergency_contact text NOT NULL,
  signed_by_user_id text,  -- Clerk user ID
  signed_at timestamptz,
  expires_at timestamptz,
  status text NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','ACTIVE','EXPIRED','REVOKED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS roe_audit_order_id_idx ON rules_of_engagement(audit_order_id);

-- assessment_executions
CREATE TABLE IF NOT EXISTS assessment_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  audit_order_id uuid NOT NULL REFERENCES audit_orders(id) ON DELETE RESTRICT,
  target_id uuid NOT NULL REFERENCES audit_targets(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'QUEUED' CHECK (status IN (
    'QUEUED','RUNNING','COMPLETE','FAILED','CANCELED'
  )),
  total_tests integer NOT NULL DEFAULT 0,
  completed_tests integer NOT NULL DEFAULT 0,
  failed_tests integer NOT NULL DEFAULT 0,
  started_at timestamptz,
  completed_at timestamptz,
  failure_reason text,
  worker_id text,
  correlation_id text NOT NULL DEFAULT gen_random_uuid()::text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS assessment_executions_audit_order_id_idx ON assessment_executions(audit_order_id);
CREATE INDEX IF NOT EXISTS assessment_executions_status_idx ON assessment_executions(status);

-- assessment_test_results
CREATE TABLE IF NOT EXISTS assessment_test_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  execution_id uuid NOT NULL REFERENCES assessment_executions(id) ON DELETE CASCADE,
  test_definition_id text NOT NULL,  -- e.g. 'mcp-pi-001'
  test_category text NOT NULL,
  status text NOT NULL CHECK (status IN ('PASS','FAIL','ERROR','SKIPPED')),
  passed boolean NOT NULL,
  severity text NOT NULL CHECK (severity IN ('CRITICAL','HIGH','MEDIUM','LOW','INFO')),
  request_summary text,  -- sanitized summary of what was sent
  redacted_response text,  -- response with secrets masked
  evidence_hash text,  -- SHA-256(testId+request+response+executedAt)
  duration_ms integer,
  error text,
  executed_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS test_results_execution_id_idx ON assessment_test_results(execution_id);
CREATE INDEX IF NOT EXISTS test_results_status_idx ON assessment_test_results(status);

-- audit_reviews (reviewer decisions)
CREATE TABLE IF NOT EXISTS audit_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  audit_order_id uuid NOT NULL REFERENCES audit_orders(id) ON DELETE RESTRICT,
  reviewer_user_id text NOT NULL,  -- Clerk user ID
  decision text NOT NULL CHECK (decision IN ('APPROVED','REJECTED','REMEDIATION_REQUIRED','RETEST_REQUIRED')),
  notes text,
  reviewed_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_reviews_audit_order_id_idx ON audit_reviews(audit_order_id);

-- audit_events (immutable event log)
CREATE TABLE IF NOT EXISTS audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
  audit_order_id uuid REFERENCES audit_orders(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  actor_user_id text,
  actor_type text NOT NULL DEFAULT 'user' CHECK (actor_type IN ('user','system','stripe','worker')),
  payload jsonb NOT NULL DEFAULT '{}',
  occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_events_audit_order_id_idx ON audit_events(audit_order_id);
CREATE INDEX IF NOT EXISTS audit_events_occurred_at_idx ON audit_events(occurred_at);

-- stripe_events (idempotency store)
CREATE TABLE IF NOT EXISTS stripe_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id text UNIQUE NOT NULL,
  event_type text NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now()
);

-- user_roles (maps Clerk user IDs to platform roles)
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id text UNIQUE NOT NULL,
  role text NOT NULL DEFAULT 'customer' CHECK (role IN ('customer','reviewer','admin')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE audit_orders ADD COLUMN IF NOT EXISTS passport_id uuid REFERENCES security_passports(passport_id) ON DELETE SET NULL;
