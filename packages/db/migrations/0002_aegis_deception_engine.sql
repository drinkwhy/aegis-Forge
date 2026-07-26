CREATE TABLE IF NOT EXISTS honeytokens (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agent_session_id text NOT NULL,
  token_type text NOT NULL,
  name text NOT NULL,
  value text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}',
  active boolean NOT NULL DEFAULT true,
  created_at timestamp NOT NULL DEFAULT now(),
  last_triggered_at timestamp
);

CREATE INDEX IF NOT EXISTS honeytokens_user_session_idx
  ON honeytokens(user_id, agent_session_id);

CREATE INDEX IF NOT EXISTS honeytokens_active_value_idx
  ON honeytokens(user_id, agent_session_id, active);

ALTER TABLE security_logs
  ADD COLUMN IF NOT EXISTS severity text NOT NULL DEFAULT 'INFO';
