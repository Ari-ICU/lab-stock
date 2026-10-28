import dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';
const jwtSecret = process.env.JWT_SECRET || 'lab-stock-production-secure-key-2026';

if (isProduction && (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)) {
  console.warn(
    '⚠️ [SECURITY WARNING] In production, JWT_SECRET must be set in .env with at least 32 characters of high-entropy random characters.'
  );
}

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
