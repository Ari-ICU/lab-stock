import { query } from '../config/database.js';

export interface PurchaseRequestRecord {
  id: string;
  title: string;
  category: string;
  target_room: string;
  quantity: number;
  unit: string;
  estimated_cost?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'approved' | 'ordered' | 'fulfilled' | 'rejected';
  reason: string;
  requested_by: string;
  requester_role: string;
  request_date: string;
  notes?: string;
  created_at?: Date;
  updated_at?: Date;
}

export const purchaseRequestModel = {
  async findAll(status?: string): Promise<PurchaseRequestRecord[]> {
    try {
      let sql = 'SELECT * FROM purchase_requests WHERE 1=1';
      const params: any[] = [];

      if (status && status !== 'all') {
        params.push(status);
        sql += ` AND status = $${params.length}`;
      }

      sql += ' ORDER BY request_date DESC, created_at DESC';
      const res = await query(sql, params);
      return res.rows;
    } catch {
      return [];
    }
  },

  async findById(id: string): Promise<PurchaseRequestRecord | null> {
    try {
      const res = await query('SELECT * FROM purchase_requests WHERE id = $1', [id]);
      return res.rows[0] || null;
    } catch {
      return null;
    }
  },

  async create(data: Omit<PurchaseRequestRecord, 'created_at' | 'updated_at'>): Promise<PurchaseRequestRecord> {
    const res = await query(
      `INSERT INTO purchase_requests (
         id, title, category, target_room, quantity, unit,
         estimated_cost, priority, status, reason, requested_by, requester_role, request_date, notes
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING *`,
      [
        data.id,
        data.title,
        data.category,
        data.target_room,
        data.quantity || 1,
        data.unit || 'Units',
        data.estimated_cost || null,
        data.priority || 'medium',
        data.status || 'pending',
        data.reason,
        data.requested_by,
        data.requester_role,
        data.request_date || new Date().toISOString().split('T')[0],
        data.notes || null,
      ]
    );
    return res.rows[0];
  },

  async updateStatus(id: string, status: string, notes?: string): Promise<PurchaseRequestRecord | null> {
    const res = await query(
      `UPDATE purchase_requests 
       SET status = $1, notes = COALESCE($2, notes), updated_at = CURRENT_TIMESTAMP 
       WHERE id = $3 
       RETURNING *`,
      [status, notes || null, id]
    );
    return res.rows[0] || null;
  },

  async delete(id: string): Promise<boolean> {
    const res = await query('DELETE FROM purchase_requests WHERE id = $1', [id]);
    return (res.rowCount ?? 0) > 0;
  },
};

