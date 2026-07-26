ALTER TABLE security_logs
  ADD COLUMN IF NOT EXISTS trust_score text,
  ADD COLUMN IF NOT EXISTS trust_signals jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS approval_required boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'not_required';

CREATE TABLE IF NOT EXISTS mcp_manifests (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  server_id text NOT NULL,
  manifest_hash text NOT NULL,
  manifest jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'approved',
  drift_summary text,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS mcp_manifests_user_server_idx ON mcp_manifests(user_id, server_id);

CREATE TABLE IF NOT EXISTS approval_requests (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agent_session_id text NOT NULL,
  destination text NOT NULL,
  agent_task text NOT NULL,
  risk_summary text NOT NULL,
  trust_score text NOT NULL,
  trust_signals jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  expires_at timestamp NOT NULL,
  created_at timestamp NOT NULL DEFAULT now(),
  decided_at timestamp
);

CREATE INDEX IF NOT EXISTS approval_requests_user_status_idx ON approval_requests(user_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS agent_passports (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agent_session_id text NOT NULL,
  token_hash text NOT NULL,
  scopes jsonb NOT NULL DEFAULT '{}'::jsonb,
  revoked boolean NOT NULL DEFAULT false,
  expires_at timestamp NOT NULL,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS agent_passports_user_session_idx ON agent_passports(user_id, agent_session_id);
CREATE UNIQUE INDEX IF NOT EXISTS agent_passports_token_hash_idx ON agent_passports(token_hash);

CREATE TABLE IF NOT EXISTS credential_refs (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  ref text NOT NULL,
  secret_ciphertext text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS credential_refs_user_ref_idx ON credential_refs(user_id, ref);
