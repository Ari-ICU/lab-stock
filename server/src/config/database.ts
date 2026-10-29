import pg from 'pg';
import { config } from './index.js';

const { Pool, Client } = pg;

// Create PostgreSQL connection pool optimized for concurrent multi-user load
const poolConfig: pg.PoolConfig = config.db.url
  ? { connectionString: config.db.url }
  : {
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.password,
      database: config.db.database,
    };

export const pool = new Pool({
  ...poolConfig,
  max: 20, // Support up to 20 concurrent DB connections per worker
  idleTimeoutMillis: 30000, // Close idle connections after 30s
  connectionTimeoutMillis: 5000, // Fail fast after 5s if pool is exhausted
});

pool.on('error', (err) => {
  console.error('⚠️ Unexpected error on idle PostgreSQL client:', err.message);
});

/**
 * Execute parameterized query safely
 */
export async function query(text: string, params?: any[]) {
  const res = await pool.query(text, params);
  return res;
}

/**
 * Execute operations within an atomic PostgreSQL transaction with automatic rollback on error.
 * Critical for preventing race conditions and partial writes in multi-user concurrent operations.
 */
export async function withTransaction<T>(
  callback: (client: pg.PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch {}
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Automatically creates the database (e.g. 'lab_stock') if it does not yet exist
 * by connecting to the default administrative 'postgres' database.
 */
export async function autoCreateDatabaseIfMissing(targetDbName = 'lab_stock'): Promise<boolean> {
  const adminClient = new Client(
    config.db.url
      ? { connectionString: config.db.url.replace(/\/[^/?]+(\?.*)?$/, '/postgres$1') }
      : {
          host: config.db.host,
          port: config.db.port,
          user: config.db.user,
          password: config.db.password,
          database: 'postgres',
        }
  );

  try {
    await adminClient.connect();
    const checkRes = await adminClient.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [targetDbName]
    );

    if (checkRes.rowCount === 0) {
      console.log(`🔨 Database "${targetDbName}" not found. Creating it now...`);
      // Database names cannot be parameterized in CREATE DATABASE
      await adminClient.query(`CREATE DATABASE "${targetDbName}"`);
      console.log(`✅ Successfully created PostgreSQL database "${targetDbName}"!`);
    }

    await adminClient.end();
    return true;
  } catch (err: any) {
    try {
      await adminClient.end();
    } catch {}
    return false;
  }
}

/**
 * Test PostgreSQL connectivity gracefully with auto-creation support
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
    // If the database does not exist (code 3D000), attempt auto-creation
    if (err.code === '3D000' || err.message?.includes('does not exist')) {
      const created = await autoCreateDatabaseIfMissing('lab_stock');
      if (created) {
        try {
          const client = await pool.connect();
          const result = await client.query('SELECT NOW() as current_time');
          client.release();
          return {
            connected: true,
            message: `PostgreSQL Database created and connected (${result.rows[0].current_time})`,
          };
        } catch {}
      }
    }

    return {
      connected: false,
      message: `PostgreSQL connection unavailable: ${err.message}`,
    };
  }
}
