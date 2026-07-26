CREATE TABLE IF NOT EXISTS "feedback" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "category" text NOT NULL,
  "rating" integer,
  "message" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "feedback_user_id_created_at_idx"
  ON "feedback" ("user_id", "created_at" DESC);
