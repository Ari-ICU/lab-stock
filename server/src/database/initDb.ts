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
      const seedPassword =
        process.env.SEED_DEFAULT_PASSWORD?.trim() ||
        (process.env.NODE_ENV !== 'production' ? 'password123' : '');

      if (!seedPassword) {
        console.warn(
          '⚠️ [SECURITY] Database has 0 users and SEED_DEFAULT_PASSWORD is not set in production. Skipping default account creation.'
        );
      } else {
        console.log('🌱 Database is empty. Seeding initial faculty and administrator accounts...');

        const hashedPassword = await hashPassword(seedPassword);

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
        ];

        for (const u of initialUsers) {
          await query(
            `INSERT INTO users (name, email, password_hash, role, is_admin, department, assigned_labs)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (email) DO UPDATE SET assigned_labs = EXCLUDED.assigned_labs`,
            [u.name, u.email, u.password_hash, u.role, u.is_admin, u.department, u.assigned_labs]
          );
        }

        console.log(`✅ Seeded ${initialUsers.length} initial faculty users with official @rupp.edu.kh university credentials.`);
      }
    }

    // Ensure backward-compatible columns exist on older database instances
    await pool.query(`
      ALTER TABLE locations DROP COLUMN IF EXISTS image_url;
      ALTER TABLE maintenance_records ADD COLUMN IF NOT EXISTS image_url TEXT;
      ALTER TABLE maintenance_records ADD COLUMN IF NOT EXISTS location TEXT;
      ALTER TABLE maintenance_records ADD COLUMN IF NOT EXISTS cost NUMERIC(12, 2);
      ALTER TABLE maintenance_records ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1;
      ALTER TABLE maintenance_records ADD COLUMN IF NOT EXISTS unit VARCHAR(50) DEFAULT 'units';
      ALTER TABLE purchase_requests ADD COLUMN IF NOT EXISTS supervised_by VARCHAR(150);
    `);

    // Purge any unlinked standalone room_inventory rows so classrooms strictly reflect Inventory (/stock) or Hardware Assets (/assets)
    await pool.query(
      'DELETE FROM room_inventory WHERE stock_item_id IS NULL AND asset_id IS NULL'
    ).catch(() => {});

    // Consolidate any legacy duplicate room_inventory rows referencing the same stock item or asset within the same room
    const dupGroupsRes = await pool
      .query(
        `SELECT room_id, stock_item_id, asset_id, array_agg(id ORDER BY created_at ASC, id ASC) AS ids
         FROM room_inventory
         WHERE stock_item_id IS NOT NULL OR asset_id IS NOT NULL
         GROUP BY room_id, stock_item_id, asset_id
         HAVING COUNT(*) > 1`
      )
      .catch(() => ({ rows: [] as any[] }));

    for (const group of dupGroupsRes.rows) {
      const ids: string[] = group.ids || [];
      if (ids.length < 2) continue;
      const rowsRes = await query(
        'SELECT * FROM room_inventory WHERE id = ANY($1::uuid[]) ORDER BY created_at ASC, id ASC',
        [ids]
      );
      const rows = rowsRes.rows;
      if (rows.length < 2) continue;

      const primary = rows[0];
      const sumWorking = rows.reduce((s: number, r: any) => s + Number(r.qty_working || 0), 0);
      const sumBroken = rows.reduce((s: number, r: any) => s + Number(r.qty_broken || 0), 0);
      const sumMaintenance = rows.reduce((s: number, r: any) => s + Number(r.qty_maintenance || 0), 0);
      const uniqueRemarks = Array.from(
        new Set(
          rows
            .flatMap((r: any) => String(r.remarks || '').split(' · '))
            .map((s: string) => s.trim())
            .filter(Boolean)
        )
      );

      await query(
        `UPDATE room_inventory
         SET qty_working = $1,
             qty_broken = $2,
             qty_maintenance = $3,
             remarks = $4,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $5`,
        [
          sumWorking,
          sumBroken,
          sumMaintenance,
          uniqueRemarks.length > 0 ? uniqueRemarks.join(' · ') : null,
          primary.id,
        ]
      );
      await query('DELETE FROM room_inventory WHERE id = ANY($1::uuid[])', [ids.slice(1)]);
    }

    // Sync existing stock_items categories + starter categories into the categories table
    const starterCategories = [
      'Furniture & Fixtures',
      'Power & Climate',
      'Safety & Misc',
      'Office Stationery',
      'Printer Ink & Toner',
      'Tools & Equipment',
      'Monitors',
      'Mice & Keyboards',
      'Cables & Accessories',
      'Network Spares',
      'Networking Equipment',
      'Electronics & Tools',
    ];
    for (const cat of starterCategories) {
      await query(
        `INSERT INTO categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`,
        [cat]
      ).catch(() => {});
    }
    await pool.query(`
      INSERT INTO categories (name)
      SELECT DISTINCT TRIM(category) FROM stock_items
      WHERE category IS NOT NULL AND TRIM(category) <> ''
      ON CONFLICT (name) DO NOTHING
    `).catch(() => {});

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
