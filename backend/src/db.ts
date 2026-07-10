import { Pool } from 'pg';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn('WARNING: DATABASE_URL is not set. Database operations will fail.');
}

const isAWS = connectionString?.includes('amazonaws') || connectionString?.includes('rds');

export const pool = new Pool({
  connectionString,
  ssl: isAWS
    ? { rejectUnauthorized: false }
    : connectionString?.includes('sslmode=require')
      ? { rejectUnauthorized: false }
      : undefined,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export async function query<T = Record<string, unknown>>(
  text: string,
  params?: unknown[],
): Promise<T[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result.rows as T[];
  } finally {
    client.release();
  }
}

export async function queryOne<T = Record<string, unknown>>(
  text: string,
  params?: unknown[],
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

/**
 * Locate the schema.sql file. Railway/Nixpacks builds are inconsistent about
 * which non-compiled directories survive into the runtime image, so we search a
 * wide set of candidate locations and log every probe. The build context root
 * is typically /app (rootDirectory=backend), with the compiled entrypoint at
 * /app/dist/index.js (so __dirname === /app/dist).
 */
function findSchemaFile(): string | null {
  const cwd = process.cwd();
  const candidates = [
    join(__dirname, '..', 'database', 'schema.sql'), // /app/database/schema.sql
    join(__dirname, 'database', 'schema.sql'), // /app/dist/database/schema.sql
    join(__dirname, '..', '..', 'database', 'schema.sql'), // repo-root database/schema.sql
    join(cwd, 'database', 'schema.sql'),
    join(cwd, '..', 'database', 'schema.sql'),
    join(cwd, 'backend', 'database', 'schema.sql'),
    join(cwd, 'dist', 'database', 'schema.sql'),
    '/app/database/schema.sql',
    '/app/backend/database/schema.sql',
  ];
  for (const c of candidates) {
    const ok = existsSync(c);
    console.log(`[initSchema] probe ${ok ? 'FOUND' : 'miss '} ${c}`);
    if (ok) return c;
  }
  // Last resort: shallow scan of common roots for a database/schema.sql.
  for (const root of [cwd, join(__dirname, '..'), '/app']) {
    try {
      const dbDir = join(root, 'database');
      if (existsSync(dbDir)) {
        for (const f of readdirSync(dbDir)) {
          if (f.endsWith('.sql')) {
            const p = join(dbDir, f);
            console.log(`[initSchema] scan FOUND ${p}`);
            return p;
          }
        }
      }
    } catch {
      /* ignore */
    }
  }
  return null;
}

/**
 * Initialize the database schema on startup. The schema uses
 * `CREATE TABLE IF NOT EXISTS` and idempotent seed inserts, so running it on
 * every boot is safe. Without this, tables never exist and every query 500s.
 */
export async function initSchema(): Promise<void> {
  if (!connectionString) {
    console.warn('[initSchema] skipped: DATABASE_URL not set.');
    return;
  }
  console.log(`[initSchema] __dirname=${__dirname} cwd=${process.cwd()}`);
  const schemaPath = findSchemaFile();
  if (!schemaPath) {
    console.error(
      '[initSchema] FATAL: schema.sql not found in any known location. Tables will not exist.',
    );
    return;
  }
  const sql = readFileSync(schemaPath, 'utf8');
  const client = await pool.connect();
  try {
    await client.query(sql);
    console.log(`[initSchema] schema applied from ${schemaPath}`);
  } finally {
    client.release();
  }
}

/** Lightweight connectivity probe for the health endpoint. */
export async function isDbUp(): Promise<boolean> {
  if (!connectionString) return false;
  try {
    const client = await pool.connect();
    try {
      await client.query('SELECT 1');
      return true;
    } finally {
      client.release();
    }
  } catch {
    return false;
  }
}
