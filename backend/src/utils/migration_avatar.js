import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config({ path: path.join(__dirname, '../../../.env') });

const { Pool } = pg;
const pool = new Pool({
  user: process.env.POSTGRES_USER || 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  database: process.env.POSTGRES_DB || 'tungumarket',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
});

const migrate = async () => {
  try {
    const client = await pool.connect();
    console.log('Adding avatar_url to users table...');
    await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;');
    console.log('Migration successful.');
    client.release();
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await pool.end();
  }
};

migrate();
