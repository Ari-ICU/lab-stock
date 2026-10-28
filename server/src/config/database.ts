import pg from 'pg';
import { config } from './index.js';

const { Pool } = pg;

// Create PostgreSQL connection pool
export const pool = new Pool(
  config.db.url
    ? { connectionString: config.db.url }
    : {
        host: config.db.host,
        port: config.db.port,
        user: config.db.user,
        password: config.db.password,
        database: config.db.database,
      }
);

pool.on('error', (err) => {
  console.error('⚠️ Unexpected error on idle PostgreSQL client:', err.message);
});

/**
 * Execute parameterized query safely
 */
export async function query(text: string, params?: any[]) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  if (process.env.NODE_ENV === 'development') {
    // optional debug logging
  }
  return res;
}

/**
 * Test PostgreSQL connectivity gracefully (does not crash app if offline)
 */
export async function testDatabaseConnection(): Promise<{ connected: boolean; message: string }> {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, version()');
    client.release();
    return {
      connected: true,
      message: `PostgreSQL Connected successfully (${result.rows[0].current_time})`,
    };
  } catch (err: any) {
    return {
      connected: false,
      message: `PostgreSQL connection unavailable: ${err.message}`,
    };
  }
}

