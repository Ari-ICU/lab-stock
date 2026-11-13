import dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';
const envJwtSecret = process.env.JWT_SECRET?.trim();

if (isProduction && (!envJwtSecret || envJwtSecret.length < 32)) {
  throw new Error(
    'FATAL [SECURITY]: In production, JWT_SECRET must be set in environment variables with at least 32 characters.'
  );
}

if (!isProduction && !envJwtSecret) {
  console.warn(
    '⚠️ [SECURITY WARNING] JWT_SECRET is not set; using ephemeral development fallback secret.'
  );
}

const jwtSecret = envJwtSecret || 'dev-only-lab-stock-secret-do-not-use-in-prod-2026';

export const config = {
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 5001,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  db: {
    url: process.env.DATABASE_URL,
    host: process.env.PGHOST || 'localhost',
    port: process.env.PGPORT ? parseInt(process.env.PGPORT, 10) : 5432,
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'postgres',
    database: process.env.PGDATABASE || 'lab_stock',
  },
};
