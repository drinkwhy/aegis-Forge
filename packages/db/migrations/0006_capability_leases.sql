CREATE TABLE IF NOT EXISTS "capability_leases" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "token_hash" text NOT NULL UNIQUE,
  "action_hash" text NOT NULL,
  "agent_id" text NOT NULL DEFAULT 'unknown-agent',
  "destination" text NOT NULL,
  "target_host" text NOT NULL DEFAULT 'unknown-host',
  "method" text NOT NULL DEFAULT 'GET',
  "nonce" text NOT NULL DEFAULT '',
  "scopes" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "status" text NOT NULL DEFAULT 'issued',
  "issued_at" timestamp NOT NULL DEFAULT now(),
  "expires_at" timestamp NOT NULL,
  "consumed_at" timestamp
);
