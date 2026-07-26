import { defineConfig } from "drizzle-kit";
import { loadWorkspaceEnv } from "./src/env";

loadWorkspaceEnv();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

function withoutSslQueryParams(connectionString: string): string {
  const url = new URL(connectionString);
  url.searchParams.delete("sslmode");
  url.searchParams.delete("sslcert");
  url.searchParams.delete("sslkey");
  url.searchParams.delete("sslrootcert");
  return url.toString();
}

const useSsl = !process.env.DATABASE_URL.includes("sslmode=disable");

export default defineConfig({
  schema: "./src/schema/*.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: useSsl ? withoutSslQueryParams(process.env.DATABASE_URL) : process.env.DATABASE_URL,
    ssl: useSsl ? { rejectUnauthorized: false } : false,
  },
});
