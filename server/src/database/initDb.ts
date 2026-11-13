import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool, query } from '../config/database.js';
import { hashPassword } from '../utils/password.js';
import { seedAllData, seedLoans, seedMaintenance, seedPurchaseRequests, seedRoomInventory } from './seedData.js';

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

    // Seed historical maintenance records only when the table is empty
    const maintCountRes = await pool.query('SELECT COUNT(*)::int as count FROM maintenance_records');
    const maintCount = maintCountRes.rows[0]?.count || 0;
    if (maintCount === 0) {
      for (const m of seedMaintenance) {
        const assetRes = await query('SELECT id FROM assets WHERE serial_number = $1', [m.serial_number]);
        const assetId = assetRes.rows[0]?.id || null;
        await query(
          `INSERT INTO maintenance_records (asset_id, asset_name, serial_number, type, date, technician, status, notes, image_url, location, cost, quantity, unit)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
          [
            assetId,
            m.asset_name,
            m.serial_number,
            m.type,
            m.date,
            m.technician,
            m.status,
            m.notes,
            m.image_url,
            m.location,
            m.cost,
            m.quantity,
            m.unit,
          ]
        );
      }
      console.log(`✅ Seeded ${seedMaintenance.length} historical maintenance records into PostgreSQL.`);
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
           ON CONFLICT (id) DO NOTHING`,
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

    // Ensure room facility inventory (furniture & equipment) is populated in PostgreSQL
    const roomInvCountRes = await pool.query('SELECT COUNT(*)::int as count FROM room_inventory');
    const roomInvCount = roomInvCountRes.rows[0]?.count || 0;
    if (roomInvCount === 0) {
      for (const inv of seedRoomInventory) {
        const locRes = await query('SELECT id FROM locations WHERE code = $1', [inv.room_code]);
        const roomId = locRes.rows[0]?.id;
        if (roomId) {
          await query(
            `INSERT INTO room_inventory (room_id, name, group_type, brand_spec, unit, qty_working, qty_broken, qty_maintenance, remarks)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
              roomId,
              inv.name,
              inv.group_type,
              inv.brand_spec || null,
              inv.unit || 'pcs',
              inv.qty_working || 0,
              inv.qty_broken || 0,
              inv.qty_maintenance || 0,
              inv.remarks || null,
            ]
          );
        }
      }
      console.log(`✅ Seeded ${seedRoomInventory.length} Room Facility Inventory Records into PostgreSQL.`);
    }

    // Ensure room_inventory items link with matching stock_items by name or SKU
    await pool.query(`
      UPDATE room_inventory ri
      SET stock_item_id = s.id
      FROM stock_items s
      WHERE ri.stock_item_id IS NULL AND (
        LOWER(TRIM(ri.name)) = LOWER(TRIM(s.name)) OR
        LOWER(TRIM(ri.name)) = LOWER(TRIM(s.code))
      )
    `).catch(() => {});

    // Sync existing stock_items categories + starter categories into the categories table
    const starterCategories = [
      'Office Stationery',
      'Printer Ink & Toner',
      'Tools & Equipment',
      'Monitors',
      'Mice & Keyboards',
      'Cables & Accessories',
      'Power & Climate',
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
