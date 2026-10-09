import postgres from "postgres";

let sql: ReturnType<typeof postgres> | null = null;

/** Direct Postgres (Supabase pooler) when REST API keys are not configured. */
export function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("Missing DATABASE_URL");
  }
  if (!sql) {
    sql = postgres(url, { ssl: "require", max: 3 });
  }
  return sql;
}

export function isDatabaseUrlConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}
