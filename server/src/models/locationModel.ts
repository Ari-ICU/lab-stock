import { query } from '../config/database.js';

export interface Location {
  id: string;
  code: string;
  name: string;
  room: string;
  building: string;
  capacity?: number;
  created_at?: Date;
}

export const locationModel = {
  async findAll(): Promise<Location[]> {
    try {
      const res = await query('SELECT * FROM locations ORDER BY name ASC');
      return res.rows;
    } catch {
      return [];
    }
  },

  async findById(id: string): Promise<Location | null> {
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id.trim());
      if (!isUuid) return null;

      const res = await query('SELECT * FROM locations WHERE id = $1 LIMIT 1', [id.trim()]);
      return res.rows[0] || null;
    } catch {
      return null;
    }
  },

  async findByCode(code: string): Promise<Location | null> {
    try {
      const res = await query('SELECT * FROM locations WHERE UPPER(code) = UPPER($1) LIMIT 1', [code.trim()]);
      return res.rows[0] || null;
    } catch {
      return null;
    }
  },

  async create(loc: Omit<Location, 'id' | 'created_at'>): Promise<Location> {
    const res = await query(
      `INSERT INTO locations (code, name, room, building, capacity)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [loc.code.trim().toUpperCase(), loc.name.trim(), loc.room.trim(), loc.building.trim(), loc.capacity || 30]
    );
    return res.rows[0];
  },
};
