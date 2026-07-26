CREATE TABLE IF NOT EXISTS users (
  id text PRIMARY KEY,
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  subscription_tier text NOT NULL DEFAULT 'free',
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS api_keys (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  api_key_hash text NOT NULL UNIQUE,
  name text NOT NULL,
  prefix text NOT NULL,
  created_at timestamp NOT NULL DEFAULT now(),
  last_used_at timestamp
);

CREATE INDEX IF NOT EXISTS api_keys_user_id_idx ON api_keys(user_id);

DO $$
BEGIN
  IF to_regclass('public.security_rules') IS NOT NULL THEN
    ALTER TABLE security_rules ADD COLUMN IF NOT EXISTS user_id text;
    CREATE INDEX IF NOT EXISTS security_rules_user_id_idx ON security_rules(user_id);

    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'security_rules_user_id_users_id_fk'
    ) THEN
      ALTER TABLE security_rules
        ADD CONSTRAINT security_rules_user_id_users_id_fk
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
  END IF;

  IF to_regclass('public.security_logs') IS NOT NULL THEN
    ALTER TABLE security_logs ADD COLUMN IF NOT EXISTS user_id text;
    CREATE INDEX IF NOT EXISTS security_logs_user_id_idx ON security_logs(user_id);

    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'security_logs_user_id_users_id_fk'
    ) THEN
      ALTER TABLE security_logs
        ADD CONSTRAINT security_logs_user_id_users_id_fk
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.rules') IS NOT NULL THEN
    ALTER TABLE rules ADD COLUMN IF NOT EXISTS user_id text;
  END IF;

  IF to_regclass('public.logs') IS NOT NULL THEN
    ALTER TABLE logs ADD COLUMN IF NOT EXISTS user_id text;
  END IF;

  IF to_regclass('public.stats') IS NOT NULL THEN
    ALTER TABLE stats ADD COLUMN IF NOT EXISTS user_id text;
  END IF;
END $$;
