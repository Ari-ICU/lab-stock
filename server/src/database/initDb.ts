import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool, query } from '../config/database.js';
import { hashPassword } from '../utils/password.js';
import { seedAllData, seedLoans, seedTransfers, seedMaintenance, seedPurchaseRequests } from './seedData.js';

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
          email: 'heng.sovannarith@rupp.edu.kh',
          password_hash: hashedPassword,
          role: 'Primary Lab Administrator',
          is_admin: true,
          department: 'Engineering Block A - Room 102B',
          assigned_labs: ['all'],
        },
        {
          name: 'Thoeurn Ratha',
          email: 'thoeurn.ratha@rupp.edu.kh',
          password_hash: hashedPassword,
          role: 'Faculty Lecturer',
          is_admin: false,
          department: 'Software Engineering Department',
          assigned_labs: ['Room 102B', 'Room 206'],
        },
        {
          name: 'John Doe',
          email: 'john.doe@rupp.edu.kh',
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

      console.log('✅ Seeded 3 initial faculty users with official @rupp.edu.kh university credentials.');
    }

    // Purge any legacy lab assistant accounts from PostgreSQL
    try {
      await pool.query(`
        DELETE FROM users WHERE role = 'Lab Assistant' OR email LIKE '%vicheka%' OR email LIKE '%assistant%';
      `);
    } catch {
      // Ignore
    }

    // Migrate any legacy @lab.edu emails in PostgreSQL to official @rupp.edu.kh university domains
    try {
      await pool.query(`
        UPDATE users SET email = 'thoeurn.ratha@rupp.edu.kh', assigned_labs = '{"Room 102B", "Room 206"}' 
        WHERE email = 'admin@lab.edu' OR email = 'ratha@lab.edu' OR email = 'thoeurn.ratha@lab.edu';

        UPDATE users SET email = 'heng.sovannarith@rupp.edu.kh' 
        WHERE email = 'sovannarith@lab.edu' OR email = 'heng.sovannarith@lab.edu';

        UPDATE users SET email = 'chan.vicheka@rupp.edu.kh', assigned_labs = '{"Room 102B", "Room 206"}' 
        WHERE email = 'assistant@lab.edu' OR email = 'vakhim@lab.edu' OR email = 'chan.vicheka@lab.edu';

        UPDATE users SET email = 'john.doe@rupp.edu.kh' 
        WHERE email = 'john.doe@lab.edu';
      `);
    } catch {
      // Ignore migration errors if records are already up to date
    }

    // Check if locations/assets/stock are empty; seed if needed
    const assetCountRes = await pool.query('SELECT COUNT(*)::int as count FROM assets');
    const assetCount = assetCountRes.rows[0]?.count || 0;

    if (assetCount === 0) {
      await seedAllData();
    }

    // Ensure loans and transfers are populated in PostgreSQL
    const loanCountRes = await pool.query('SELECT COUNT(*)::int as count FROM loans');
    const loanCount = loanCountRes.rows[0]?.count || 0;
    if (loanCount === 0) {
      for (const l of seedLoans) {
        const assetRes = await query('SELECT id FROM assets WHERE serial_number = $1', [l.serial_number]);
        const assetId = assetRes.rows[0]?.id;
        if (assetId) {
          await query(
            `INSERT INTO loans (
               asset_id, borrower_name, borrower_role, borrower_contact, course_or_class,
               borrow_date, expected_return_date, actual_return_date, status, notes
             )
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             ON CONFLICT DO NOTHING`,
            [
              assetId,
              l.borrower_name,
              l.borrower_role,
              l.borrower_contact,
              l.course_or_class,
              l.borrow_date,
              l.expected_return_date,
              (l as any).actual_return_date || null,
              l.status,
              l.notes,
            ]
          );
        }
      }
      console.log('✅ Seeded device loans into PostgreSQL.');
    }

    // Ensure maintenance records are populated in PostgreSQL
    const maintCountRes = await pool.query('SELECT COUNT(*)::int as count FROM maintenance_records');
    const maintCount = maintCountRes.rows[0]?.count || 0;
    if (maintCount === 0) {
      for (const m of seedMaintenance) {
        const assetRes = await query('SELECT id FROM assets WHERE serial_number = $1', [m.serial_number]);
        const assetId = assetRes.rows[0]?.id || null;
        await query(
          `INSERT INTO maintenance_records (asset_id, asset_name, serial_number, type, date, technician, status, notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT DO NOTHING`,
          [assetId, m.asset_name, m.serial_number, m.type, m.date, m.technician, m.status, m.notes]
        );
      }
      console.log('✅ Seeded maintenance & audit records into PostgreSQL.');
    }

    // Ensure purchase requests are populated in PostgreSQL
    const reqCountRes = await pool.query('SELECT COUNT(*)::int as count FROM purchase_requests');
    const reqCount = reqCountRes.rows[0]?.count || 0;
    if (reqCount === 0) {
      for (const r of seedPurchaseRequests) {
        await query(
          `INSERT INTO purchase_requests (
             id, title, category, target_room, quantity, unit,
             estimated_cost, priority, status, reason, requested_by, requester_role, request_date, image_url, notes
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
           ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, notes = EXCLUDED.notes, image_url = EXCLUDED.image_url`,
          [
            r.id,
            r.title,
            r.category,
            r.target_room,
            r.quantity,
            r.unit,
            r.estimated_cost,
            r.priority,
            r.status,
            r.reason,
            r.requested_by,
            r.requester_role,
            r.request_date,
            (r as any).image_url || null,
            r.notes,
          ]
        );
      }
      console.log('✅ Seeded purchase requisitions into PostgreSQL.');
    }

    // Ensure all existing purchase requests have valid image_url and supervised_by populated
    await pool.query(`
      ALTER TABLE purchase_requests ADD COLUMN IF NOT EXISTS supervised_by VARCHAR(150);
      UPDATE purchase_requests SET image_url = 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=600&q=80' WHERE id = 'REQ-2026-001' AND (image_url IS NULL OR image_url = '');
      UPDATE purchase_requests SET image_url = 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80' WHERE id = 'REQ-2026-002' AND (image_url IS NULL OR image_url = '');
      UPDATE purchase_requests SET image_url = 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&w=600&q=80', supervised_by = 'Thoeurn Ratha (Faculty Lecturer)' WHERE id = 'REQ-2026-003';
      UPDATE purchase_requests SET image_url = 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80', supervised_by = 'Thoeurn Ratha (Faculty Lecturer)' WHERE id = 'REQ-2026-004';
      UPDATE purchase_requests SET supervised_by = 'Thoeurn Ratha (Faculty Lecturer)' WHERE requested_by ILIKE '%Vicheka%' OR requester_role = 'Lab Assistant';
    `);

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
