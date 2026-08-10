import { neon } from "@neondatabase/serverless";

let _neonFn: ReturnType<typeof neon> | null = null;

function getNeonFn() {
  if (!_neonFn) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL environment variable is not set");
    _neonFn = neon(url);
  }
  return _neonFn;
}

export async function dbQuery(strings: TemplateStringsArray, ...values: unknown[]): Promise<Record<string, unknown>[]> {
  const fn = getNeonFn();
  const result = await fn(strings, ...values);
  if (Array.isArray(result)) return result as Record<string, unknown>[];
  if (result && typeof result === "object" && "rows" in result) return (result as { rows: Record<string, unknown>[] }).rows;
  return [];
}

let initialized = false;

export async function ensureSchema(): Promise<void> {
  if (initialized) return;

  const sql = getNeonFn();

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (now()::text)
    )`;

  await sql`
    CREATE TABLE IF NOT EXISTS voice_profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'draft',
      samples JSONB NOT NULL DEFAULT '[]'::jsonb,
      total_duration REAL NOT NULL DEFAULT 0,
      provider_voice_id TEXT,
      created_at TEXT NOT NULL DEFAULT (now()::text),
      updated_at TEXT NOT NULL DEFAULT (now()::text),
      processed_at TEXT,
      error_message TEXT
    )`;

  await sql`
    CREATE TABLE IF NOT EXISTS history_items (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      voice_id TEXT NOT NULL,
      voice_name TEXT NOT NULL,
      text TEXT NOT NULL,
      audio_url TEXT NOT NULL DEFAULT '',
      duration REAL NOT NULL DEFAULT 0,
      format TEXT NOT NULL DEFAULT 'mp3',
      options JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TEXT NOT NULL DEFAULT (now()::text)
    )`;

  await sql`CREATE INDEX IF NOT EXISTS idx_profiles_user ON voice_profiles(user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_history_user ON history_items(user_id)`;

  initialized = true;
}
