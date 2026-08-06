// Shared Postgres connection for Next.js API routes
// Uses the `postgres` package (same as Drizzle) for raw SQL queries

import postgres from 'postgres';

let _sql: ReturnType<typeof postgres> | null = null;

export function getSql() {
  if (!_sql) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error('DATABASE_URL not configured');
    }
    _sql = postgres(url, {
      ssl: url.includes('railway.internal') ? false : { rejectUnauthorized: false },
      max: 5,
      idle_timeout: 30,
    });
  }
  return _sql;
}
