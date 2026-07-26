ALTER TABLE approval_requests
  ADD COLUMN IF NOT EXISTS request_hash text,
  ADD COLUMN IF NOT EXISTS tool_name text,
  ADD COLUMN IF NOT EXISTS tool_action text,
  ADD COLUMN IF NOT EXISTS consumed_at timestamp;

UPDATE approval_requests
SET request_hash = 'legacy-unusable'
WHERE request_hash IS NULL;

ALTER TABLE approval_requests
  ALTER COLUMN request_hash SET NOT NULL;

CREATE INDEX IF NOT EXISTS approval_requests_request_hash_idx
  ON approval_requests(user_id, request_hash, status);
