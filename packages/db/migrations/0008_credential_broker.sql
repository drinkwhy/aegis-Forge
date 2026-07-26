ALTER TABLE credential_refs
  ADD COLUMN IF NOT EXISTS provider text NOT NULL DEFAULT 'custom',
  ADD COLUMN IF NOT EXISTS target_host text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS credential_type text NOT NULL DEFAULT 'bearer',
  ADD COLUMN IF NOT EXISTS encrypted_secret text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN IF NOT EXISTS injection jsonb NOT NULL DEFAULT '{"type":"header","name":"Authorization","prefix":"Bearer"}'::jsonb,
  ADD COLUMN IF NOT EXISTS allowed_methods jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS allowed_scopes jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS rotation_metadata jsonb NOT NULL DEFAULT '{"version":1}'::jsonb,
  ADD COLUMN IF NOT EXISTS updated_at timestamp NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS last_used_at timestamp;

UPDATE credential_refs
SET encrypted_secret = secret_ciphertext
WHERE encrypted_secret IS NULL;

ALTER TABLE capability_leases
  ADD COLUMN IF NOT EXISTS credential_ref text;

CREATE INDEX IF NOT EXISTS capability_leases_credential_ref_idx
  ON capability_leases(user_id, credential_ref, status);

CREATE TABLE IF NOT EXISTS credential_audit_events (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  credential_ref text NOT NULL,
  agent_id text NOT NULL,
  action text NOT NULL,
  target_host text NOT NULL,
  method text NOT NULL,
  request_hash text NOT NULL,
  capability_id text,
  decision text NOT NULL,
  execution_status text NOT NULL,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS credential_audit_events_user_ref_idx
  ON credential_audit_events(user_id, credential_ref, created_at DESC);
