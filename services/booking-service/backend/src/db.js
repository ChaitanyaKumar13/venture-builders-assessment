import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function initDb(retries = 10) {
  const schema = fs.readFileSync(path.join(__dirname, '../db/schema.sql'), 'utf8');
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await pool.query(schema);
      console.log('[db] schema ready');
      return;
    } catch (err) {
      console.warn(`[db] init attempt ${attempt}/${retries} failed: ${err.message}`);
      if (attempt === retries) throw err;
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
}
