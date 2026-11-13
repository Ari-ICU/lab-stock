import { query } from '../config/database.js';

export interface CategoryRecord {
  id: string;
  name: string;
  description?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

export const categoryModel = {
  async findAll(): Promise<CategoryRecord[]> {
    const res = await query(
      `SELECT id, name, description, created_at, updated_at
       FROM categories
       ORDER BY LOWER(name) ASC`
    );
    return res.rows;
  },

  async ensureExists(name: string, description?: string): Promise<CategoryRecord | null> {
    const trimmed = name.trim();
    if (!trimmed) return null;

    // Case-insensitive check first so we don't create duplicates differing only by case
    const existing = await query(
      `SELECT id, name, description, created_at, updated_at
       FROM categories
       WHERE LOWER(name) = LOWER($1)
       LIMIT 1`,
      [trimmed]
    );
    if (existing.rows.length > 0) {
      return existing.rows[0];
    }

    const res = await query(
      `INSERT INTO categories (name, description)
       VALUES ($1, $2)
       ON CONFLICT (name) DO UPDATE SET updated_at = NOW()
       RETURNING id, name, description, created_at, updated_at`,
      [trimmed, description?.trim() || null]
    );
    return res.rows[0] || null;
  },

  async delete(id: string): Promise<boolean> {
    const res = await query('DELETE FROM categories WHERE id = $1', [id]);
    return (res.rowCount ?? 0) > 0;
  },
};
