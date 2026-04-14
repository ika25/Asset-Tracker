import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../src/config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.resolve(__dirname, '../migrations');

const ensureMigrationsTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
};

const getAppliedMigrations = async () => {
  const { rows } = await pool.query('SELECT filename FROM schema_migrations ORDER BY filename ASC');
  return new Set(rows.map((row) => row.filename));
};

const applyMigration = async (filename) => {
  const filePath = path.join(migrationsDir, filename);
  const sql = await fs.readFile(filePath, 'utf8');

  await pool.query('BEGIN');
  try {
    await pool.query(sql);
    await pool.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [filename]);
    await pool.query('COMMIT');
    console.log(`Applied migration: ${filename}`);
  } catch (error) {
    await pool.query('ROLLBACK');
    throw error;
  }
};

const run = async () => {
  try {
    await ensureMigrationsTable();
    const applied = await getAppliedMigrations();
    const files = (await fs.readdir(migrationsDir))
      .filter((file) => file.endsWith('.sql'))
      .sort();

    for (const filename of files) {
      if (!applied.has(filename)) {
        await applyMigration(filename);
      }
    }

    console.log('Migrations are up to date.');
  } finally {
    await pool.end();
  }
};

run().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});