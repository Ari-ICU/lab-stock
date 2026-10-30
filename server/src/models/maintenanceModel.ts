import { query } from '../config/database.js';

export interface MaintenanceRecord {
  id: string;
  asset_id?: string | null;
  asset_name: string;
  serial_number: string;
  type: string;
  date: string;
  technician: string;
  status: 'Completed' | 'Pending' | 'In Progress';
  notes?: string;
  created_at?: Date;
  updated_at?: Date;
}

export const maintenanceModel = {
  async findAll(status?: string): Promise<MaintenanceRecord[]> {
    try {
      let sql = 'SELECT * FROM maintenance_records WHERE 1=1';
      const params: any[] = [];

      if (status && status !== 'all') {
        params.push(status);
        sql += ` AND status = $${params.length}`;
      }

      sql += ' ORDER BY date DESC, created_at DESC';
      const res = await query(sql, params);
      return res.rows;
    } catch {
      return [];
    }
  },

  async findById(id: string): Promise<MaintenanceRecord | null> {
    try {
      const res = await query('SELECT * FROM maintenance_records WHERE id = $1', [id]);
      return res.rows[0] || null;
    } catch {
      return null;
    }
  },

  async create(data: Omit<MaintenanceRecord, 'id' | 'created_at' | 'updated_at'>): Promise<MaintenanceRecord> {
    const res = await query(
      `INSERT INTO maintenance_records (asset_id, asset_name, serial_number, type, date, technician, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        data.asset_id || null,
        data.asset_name,
        data.serial_number,
        data.type,
        data.date,
        data.technician,
        data.status || 'Pending',
        data.notes || null,
      ]
    );
    return res.rows[0];
  },

  async update(id: string, data: Partial<MaintenanceRecord>): Promise<MaintenanceRecord | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (data.asset_name !== undefined) {
      fields.push(`asset_name = $${idx++}`);
      values.push(data.asset_name);
    }
    if (data.serial_number !== undefined) {
      fields.push(`serial_number = $${idx++}`);
      values.push(data.serial_number);
    }
    if (data.type !== undefined) {
      fields.push(`type = $${idx++}`);
      values.push(data.type);
    }
    if (data.date !== undefined) {
      fields.push(`date = $${idx++}`);
      values.push(data.date);
    }
    if (data.technician !== undefined) {
      fields.push(`technician = $${idx++}`);
      values.push(data.technician);
    }
    if (data.status !== undefined) {
      fields.push(`status = $${idx++}`);
      values.push(data.status);
    }
    if (data.notes !== undefined) {
      fields.push(`notes = $${idx++}`);
      values.push(data.notes);
    }

    if (fields.length === 0) return this.findById(id);

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const res = await query(
      `UPDATE maintenance_records SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    return res.rows[0] || null;
  },

  async delete(id: string): Promise<boolean> {
    const res = await query('DELETE FROM maintenance_records WHERE id = $1', [id]);
    return (res.rowCount ?? 0) > 0;
  },
};

