import { query } from '../config/database.js';

export interface StockItem {
  id: string;
  code: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  location_id?: string;
  location_name?: string;
  location_room?: string;
  rack?: string;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  min_threshold?: number;
  expiry_date?: string;
  image_url?: string;
  description?: string;
  created_at?: Date;
  updated_at?: Date;
}

export const stockModel = {
  async findAll(filters?: { category?: string; status?: string; search?: string }): Promise<StockItem[]> {
    try {
      let sql = `
        SELECT s.*, l.name as location_name, l.room as location_room 
        FROM stock_items s
        LEFT JOIN locations l ON s.location_id = l.id
        WHERE 1=1
      `;
      const params: any[] = [];

      if (filters?.category && filters.category !== 'all') {
        params.push(filters.category);
        sql += ` AND s.category = $${params.length}`;
      }

      if (filters?.status && filters.status !== 'all') {
        params.push(filters.status);
        sql += ` AND s.status = $${params.length}`;
      }

      if (filters?.search) {
        params.push(`%${filters.search}%`);
        sql += ` AND (s.name ILIKE $${params.length} OR s.code ILIKE $${params.length} OR s.description ILIKE $${params.length})`;
      }

      sql += ' ORDER BY s.created_at DESC';

      const res = await query(sql, params);
      return res.rows;
    } catch {
      return [];
    }
  },

  async findById(id: string): Promise<StockItem | null> {
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      const res = await query(
        `SELECT s.*, l.name as location_name, l.room as location_room 
         FROM stock_items s
         LEFT JOIN locations l ON s.location_id = l.id
         WHERE ${isUuid ? 's.id = $1' : 'UPPER(s.code) = UPPER($1)'} LIMIT 1`,
        [id]
      );
      return res.rows[0] || null;
    } catch {
      return null;
    }
  },

  async findByCode(code: string): Promise<StockItem | null> {
    try {
      const res = await query('SELECT * FROM stock_items WHERE UPPER(code) = UPPER($1) LIMIT 1', [
        code,
      ]);
      return res.rows[0] || null;
    } catch {
      return null;
    }
  },

  async create(item: Omit<StockItem, 'id' | 'created_at' | 'updated_at'>): Promise<StockItem> {
    const res = await query(
      `INSERT INTO stock_items (code, name, category, quantity, unit, location_id, rack, status, min_threshold, expiry_date, image_url, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        item.code,
        item.name,
        item.category,
        item.quantity,
        item.unit,
        item.location_id || null,
        item.rack || null,
        item.status,
        item.min_threshold || 10,
        item.expiry_date || 'Active',
        item.image_url || null,
        item.description || null,
      ]
    );
    return res.rows[0];
  },

  async update(id: string, item: Partial<StockItem>): Promise<StockItem | null> {
    const fields: string[] = [];
    const values: any[] = [];

    const allowed = [
      'name',
      'category',
      'quantity',
      'unit',
      'location_id',
      'rack',
      'status',
      'min_threshold',
      'expiry_date',
      'image_url',
      'description',
    ];

    allowed.forEach((key) => {
      if ((item as any)[key] !== undefined) {
        values.push((item as any)[key]);
        fields.push(`${key} = $${values.length}`);
      }
    });

    if (fields.length === 0) return this.findById(id);

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    values.push(id);
    const idClause = isUuid ? `id = $${values.length}` : `UPPER(code) = UPPER($${values.length})`;
    const sql = `UPDATE stock_items SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE ${idClause} RETURNING *`;
    const res = await query(sql, values);
    return res.rows[0] || null;
  },

  async delete(id: string): Promise<boolean> {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const sql = isUuid ? 'DELETE FROM stock_items WHERE id = $1' : 'DELETE FROM stock_items WHERE UPPER(code) = UPPER($1)';
    const res = await query(sql, [id]);
    return (res.rowCount ?? 0) > 0;
  },

  /**
   * Concurrency-safe atomic quantity increment or decrement.
   * Guarantees quantity never drops below 0 when multiple users act simultaneously.
   */
  async adjustQuantity(id: string, delta: number): Promise<StockItem | null> {
    const sql = `
      UPDATE stock_items
      SET quantity = quantity + $1,
          status = CASE
            WHEN (quantity + $1) <= 0 THEN 'out_of_stock'
            WHEN (quantity + $1) <= min_threshold THEN 'low_stock'
            ELSE 'in_stock'
          END,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND (quantity + $1) >= 0
      RETURNING *
    `;
    const res = await query(sql, [delta, id]);
    return res.rows[0] || null;
  },
};

