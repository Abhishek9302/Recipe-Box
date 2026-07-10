import { Pool } from 'pg';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn('WARNING: DATABASE_URL is not set. Database operations will fail.');
}

const isAWS = connectionString?.includes('amazonaws') || connectionString?.includes('rds');

export const pool = new Pool({
  connectionString,
  ssl: isAWS ? { rejectUnauthorized: false } : connectionString?.includes('sslmode=require') ? { rejectUnauthorized: false } : undefined,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export async function query<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
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
  params?: unknown[]
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

/**
 * Locate the schema.sql file. It may live next to the built backend (when the
 * deploy pipeline syncs it into backend/database/) or at the repo root.
 */
function findSchemaFile(): string | null {
  const candidates = [
    join(__dirname, '..', 'database', 'schema.sql'),        // backend/database/schema.sql (relative to dist/)
    join(__dirname, '..', '..', 'database', 'schema.sql'),   // repo-root database/schema.sql
    join(process.cwd(), 'database', 'schema.sql'),
    join(process.cwd(), '..', 'database', 'schema.sql'),
  ];
  for (const c of candidates) {
    if (existsSync(c)) return c;
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
    console.warn('Skipping schema init: DATABASE_URL not set.');
    return;
  }
  const schemaPath = findSchemaFile();
  if (!schemaPath) {
    console.warn('Skipping schema init: schema.sql not found in known locations.');
    return;
  }
  const sql = readFileSync(schemaPath, 'utf8');
  const client = await pool.connect();
  try {
    await client.query(sql);
    console.log(`Schema initialized from ${schemaPath}`);
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
