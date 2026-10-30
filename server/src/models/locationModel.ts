import { query } from '../config/database.js';

export interface Location {
  id: string;
  code: string;
  name: string;
  room: string;
  building: string;
  capacity?: number;
  floor?: number;
  room_type?: string;
  image_url?: string;
  last_audited_at?: Date | string;
  audited_by?: string;
  total_assets?: number;
  total_items?: number;
  inventories?: any[];
  created_at?: Date;
}

const LOCATION_SELECT_QUERY = `
  SELECT 
    l.*,
    COALESCE((SELECT COUNT(*)::int FROM assets a WHERE a.location_id = l.id), 0) AS total_assets,
    COALESCE((SELECT COUNT(*)::int FROM stock_items s WHERE s.location_id = l.id), 0) AS total_items,
    COALESCE(
      (
        SELECT json_agg(
          json_build_object(
            'id', ri.id,
            'roomId', ri.room_id,
            'name', ri.name,
            'group', ri.group_type,
            'brandSpec', ri.brand_spec,
            'unit', ri.unit,
            'qtyWorking', ri.qty_working,
            'qtyBroken', ri.qty_broken,
            'qtyMaintenance', ri.qty_maintenance,
            'remarks', ri.remarks,
            'lastAuditedAt', ri.last_audited_at
          )
        )
        FROM room_inventory ri
        WHERE ri.room_id = l.id
      ),
      '[]'::json
    ) AS inventories
  FROM locations l
`;

export const locationModel = {
  async findAll(): Promise<Location[]> {
    try {
      const res = await query(`${LOCATION_SELECT_QUERY} ORDER BY l.name ASC`);
      return res.rows;
    } catch {
      return [];
    }
  },

  async findById(id: string): Promise<Location | null> {
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id.trim());
      if (isUuid) {
        const res = await query(`${LOCATION_SELECT_QUERY} WHERE l.id = $1 LIMIT 1`, [id.trim()]);
        if (res.rows[0]) return res.rows[0];
      }

      // Fallback by room code or room name
      const resByCode = await query(`${LOCATION_SELECT_QUERY} WHERE UPPER(l.code) = UPPER($1) OR UPPER(l.room) = UPPER($1) LIMIT 1`, [id.trim()]);
      return resByCode.rows[0] || null;
    } catch {
      return null;
    }
  },

  async findByCode(code: string): Promise<Location | null> {
    try {
      const res = await query(`${LOCATION_SELECT_QUERY} WHERE UPPER(l.code) = UPPER($1) LIMIT 1`, [code.trim()]);
      return res.rows[0] || null;
    } catch {
      return null;
    }
  },

  async create(loc: Omit<Location, 'id' | 'created_at'>): Promise<Location> {
    const res = await query(
      `INSERT INTO locations (code, name, room, building, capacity, floor, room_type, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        loc.code.trim().toUpperCase(),
        loc.name.trim(),
        loc.room.trim(),
        loc.building.trim(),
        loc.capacity || 30,
        loc.floor || 1,
        loc.room_type || 'COMPUTER_LAB',
        loc.image_url || null,
      ]
    );
    return this.findById(res.rows[0].id) as Promise<Location>;
  },

  async update(id: string, loc: Partial<Location>): Promise<Location | null> {
    const fields: string[] = [];
    const values: any[] = [];

    if (loc.name !== undefined) {
      values.push(loc.name.trim());
      fields.push(`name = $${values.length}`);
    }
    if (loc.room !== undefined) {
      values.push(loc.room.trim());
      fields.push(`room = $${values.length}`);
    }
    if (loc.building !== undefined) {
      values.push(loc.building.trim());
      fields.push(`building = $${values.length}`);
    }
    if (loc.capacity !== undefined) {
      values.push(loc.capacity);
      fields.push(`capacity = $${values.length}`);
    }
    if (loc.floor !== undefined) {
      values.push(loc.floor);
      fields.push(`floor = $${values.length}`);
    }
    if (loc.room_type !== undefined) {
      values.push(loc.room_type);
      fields.push(`room_type = $${values.length}`);
    }
    if (loc.image_url !== undefined) {
      values.push(loc.image_url);
      fields.push(`image_url = $${values.length}`);
    }
    if (loc.last_audited_at !== undefined) {
      values.push(loc.last_audited_at);
      fields.push(`last_audited_at = $${values.length}`);
    }
    if (loc.audited_by !== undefined) {
      values.push(loc.audited_by);
      fields.push(`audited_by = $${values.length}`);
    }

    if (fields.length === 0) return this.findById(id);

    values.push(id);
    await query(
      `UPDATE locations SET ${fields.join(', ')} WHERE id = $${values.length}`,
      values
    );
    return this.findById(id);
  },

  async delete(id: string): Promise<boolean> {
    const res = await query('DELETE FROM locations WHERE id = $1', [id]);
    return (res.rowCount ?? 0) > 0;
  },

  // Room Inventory (Facility Matrix)
  async addRoomInventoryItem(roomId: string, item: any): Promise<any> {
    const res = await query(
      `INSERT INTO room_inventory (room_id, name, group_type, brand_spec, unit, qty_working, qty_broken, qty_maintenance, remarks)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        roomId,
        item.name,
        item.group || item.group_type || 'FURNITURE',
        item.brandSpec || item.brand_spec || null,
        item.unit || 'pcs',
        item.qtyWorking ?? item.qty_working ?? 1,
        item.qtyBroken ?? item.qty_broken ?? 0,
        item.qtyMaintenance ?? item.qty_maintenance ?? 0,
        item.remarks || null,
      ]
    );
    return res.rows[0];
  },

  async updateRoomInventoryCount(itemId: string, field: 'qtyWorking' | 'qtyBroken' | 'qtyMaintenance', delta: number): Promise<any> {
    const col = field === 'qtyWorking' ? 'qty_working' : field === 'qtyBroken' ? 'qty_broken' : 'qty_maintenance';
    const res = await query(
      `UPDATE room_inventory SET ${col} = GREATEST(0, ${col} + $1) WHERE id = $2 RETURNING *`,
      [delta, itemId]
    );
    return res.rows[0];
  },

  async deleteRoomInventoryItem(itemId: string): Promise<boolean> {
    const res = await query('DELETE FROM room_inventory WHERE id = $1', [itemId]);
    return (res.rowCount ?? 0) > 0;
  },

  async markAudited(roomId: string, auditorName: string): Promise<any> {
    const now = new Date();
    await query(
      `UPDATE locations SET last_audited_at = $1, audited_by = $2 WHERE id = $3`,
      [now, auditorName, roomId]
    );
    await query(
      `UPDATE room_inventory SET last_audited_at = $1 WHERE room_id = $2`,
      [now, roomId]
    );
    return this.findById(roomId);
  },
};
