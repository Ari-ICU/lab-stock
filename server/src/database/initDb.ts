import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool, query } from '../config/database.js';
import { hashPassword } from '../utils/password.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function initializeDatabase(): Promise<{ success: boolean; message: string }> {
  try {
    let schemaPath = path.join(__dirname, 'schema.sql');
    if (!fs.existsSync(schemaPath)) {
      // Fallback for compiled dist mode pointing to src
      const srcFallback = path.resolve(__dirname, '../../src/database/schema.sql');
      if (fs.existsSync(srcFallback)) {
        schemaPath = srcFallback;
      } else {
        throw new Error(`Schema file not found at ${schemaPath} or ${srcFallback}`);
      }
    }

    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    // Execute schema DDL
    await pool.query(schemaSql);

    // Check if initial users exist
    const userCountRes = await pool.query('SELECT COUNT(*)::int as count FROM users');
    const userCount = userCountRes.rows[0]?.count || 0;

    if (userCount === 0) {
      console.log('🌱 Database is empty. Seeding initial secure faculty and administrator accounts...');

      // Bcrypt hash for initial default accounts
      const hashedPassword = await hashPassword('password123');

      const initialUsers = [
        {
          name: 'Dr. Heng Sovannarith',
          email: 'sovannarith@lab.edu',
          password_hash: hashedPassword,
          role: 'Primary Lab Administrator',
          is_admin: true,
          department: 'Engineering Block A - Room 102B',
          assigned_labs: ['all'],
        },
        {
          name: 'Thoeurn Ratha',
          email: 'admin@lab.edu',
          password_hash: hashedPassword,
          role: 'Faculty Lecturer',
          is_admin: false,
          department: 'Software Engineering Department',
          assigned_labs: ['Rm 102B'],
        },
        {
          name: 'Chan Vicheka',
          email: 'assistant@lab.edu',
          password_hash: hashedPassword,
          role: 'Lab Assistant',
          is_admin: false,
          department: 'Hardware Depot & Lab 102B',
          assigned_labs: ['Rm 102B', 'Rm 206'],
        },
        {
          name: 'John Doe',
          email: 'john.doe@lab.edu',
          password_hash: hashedPassword,
          role: 'Primary Lab Administrator',
          is_admin: true,
          department: 'Faculty of Engineering',
          assigned_labs: ['all'],
        },
      ];

      for (const u of initialUsers) {
        await query(
          `INSERT INTO users (name, email, password_hash, role, is_admin, department, assigned_labs)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (email) DO UPDATE SET assigned_labs = EXCLUDED.assigned_labs`,
          [u.name, u.email, u.password_hash, u.role, u.is_admin, u.department, u.assigned_labs]
        );
      }

      console.log('✅ Seeded 4 initial faculty users with bcrypt-hashed credentials.');
    }

    return { success: true, message: 'Database initialized successfully' };
  } catch (err: any) {
    return { success: false, message: `Database initialization failed: ${err.message}` };
  }
}

// Standalone runner if executed directly via CLI
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  initializeDatabase()
    .then((res) => {
      console.log(res.message);
      process.exit(res.success ? 0 : 1);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
