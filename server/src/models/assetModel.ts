import { query } from '../config/database.js';

export interface Asset {
  id: string;
  serial_number: string;
  name: string;
  model: string;
  total_units: number;
  unit_type: string;
  location_id?: string;
  location_name?: string;
  placement_rack?: string;
  status: 'operational' | 'in_use' | 'maintenance';
  loan_status: 'available' | 'on_loan';
  current_borrower?: string;
  loan_due_date?: string;
  next_calibration?: string;
  image_url?: string;
  description?: string;
  created_at?: Date;
  updated_at?: Date;
}

export const assetModel = {
  async findAll(filters?: { status?: string; search?: string }): Promise<Asset[]> {
    try {
      let sql = `
        SELECT a.*, l.name as location_name, l.room as location_room 
        FROM assets a
        LEFT JOIN locations l ON a.location_id = l.id
        WHERE 1=1
      `;
      const params: any[] = [];

      if (filters?.status && filters.status !== 'all') {
        params.push(filters.status);
        sql += ` AND a.status = $${params.length}`;
      }

      if (filters?.search) {
        params.push(`%${filters.search}%`);
        sql += ` AND (a.name ILIKE $${params.length} OR a.serial_number ILIKE $${params.length} OR a.model ILIKE $${params.length})`;
      }

      sql += ' ORDER BY a.created_at DESC';

      const res = await query(sql, params);
      return res.rows;
    } catch {
      return [];
    }
  },

  async findById(id: string): Promise<Asset | null> {
    try {
      const res = await query(
        `SELECT a.*, l.name as location_name 
         FROM assets a
         LEFT JOIN locations l ON a.location_id = l.id
         WHERE a.id = $1 LIMIT 1`,
        [id]
      );
      return res.rows[0] || null;
    } catch {
      return null;
    }
  },

  async findBySerial(serial: string): Promise<Asset | null> {
    try {
      const res = await query('SELECT * FROM assets WHERE UPPER(serial_number) = UPPER($1) LIMIT 1', [
        serial,
      ]);
      return res.rows[0] || null;
    } catch {
      return null;
    }
  },

  async create(asset: Omit<Asset, 'id' | 'created_at' | 'updated_at'>): Promise<Asset> {
    const res = await query(
      `INSERT INTO assets (serial_number, name, model, total_units, unit_type, location_id, placement_rack, status, loan_status, current_borrower, loan_due_date, next_calibration, image_url, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING *`,
      [
        asset.serial_number,
        asset.name,
        asset.model,
        asset.total_units || 1,
        asset.unit_type || 'Units',
        asset.location_id || null,
        asset.placement_rack || null,
        asset.status || 'operational',
        asset.loan_status || 'available',
        asset.current_borrower || null,
        asset.loan_due_date || null,
        asset.next_calibration || null,
        asset.image_url || null,
        asset.description || null,
      ]
    );
    return res.rows[0];
  },

  async update(id: string, asset: Partial<Asset>): Promise<Asset | null> {
    const fields: string[] = [];
    const values: any[] = [];

    const allowed = [
      'name',
      'model',
      'total_units',
      'unit_type',
      'location_id',
      'placement_rack',
      'status',
      'loan_status',
      'current_borrower',
      'loan_due_date',
      'next_calibration',
      'image_url',
      'description',
    ];

    allowed.forEach((key) => {
      if ((asset as any)[key] !== undefined) {
        values.push((asset as any)[key]);
        fields.push(`${key} = $${values.length}`);
      }
    });

    if (fields.length === 0) return this.findById(id);

    values.push(id);
    const sql = `UPDATE assets SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${values.length} RETURNING *`;
    const res = await query(sql, values);
    return res.rows[0] || null;
  },

  async delete(id: string): Promise<boolean> {
    const res = await query('DELETE FROM assets WHERE id = $1', [id]);
    return (res.rowCount ?? 0) > 0;
  },
};

