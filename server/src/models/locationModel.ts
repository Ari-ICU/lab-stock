import { query } from '../config/database.js';
import { DatabaseException } from '../exceptions/errorHandler.js';
import { isValidUuid } from '../validations/commonValidation.js';

export interface Location {
  id: string;
  code: string;
  name: string;
  room: string;
  building: string;
  room_type?: string;
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
            'stockItemId', ri.stock_item_id,
            'assetId', ri.asset_id,
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
          ORDER BY ri.created_at ASC, ri.id ASC
        )
        FROM room_inventory ri
        WHERE ri.room_id = l.id
          AND (ri.stock_item_id IS NOT NULL OR ri.asset_id IS NOT NULL)
      ),
      '[]'::json
    ) AS inventories
  FROM locations l
`;

function mergeRoomRemarks(...values: Array<string | null | undefined>): string | null {
  const seen = new Set<string>();
  const parts: string[] = [];

  for (const raw of values) {
    if (!raw || typeof raw !== 'string') continue;
    for (const piece of raw.split(' · ')) {
      const trimmed = piece.trim();
      if (!trimmed) continue;
      const key = trimmed.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        parts.push(trimmed);
      }
    }
  }

  return parts.length > 0 ? parts.join(' · ') : null;
}

export const locationModel = {
  async findAll(): Promise<Location[]> {
    try {
      const res = await query(`${LOCATION_SELECT_QUERY} ORDER BY l.name ASC`);
      return res.rows;
    } catch (err: any) {
      throw new DatabaseException(`Failed to query locations: ${err.message}`, err);
    }
  },

  async findById(id: string): Promise<Location | null> {
    if (!id || typeof id !== 'string') return null;
    const trimmed = id.trim();
    if (!trimmed) return null;

    try {
      if (isValidUuid(trimmed)) {
        const res = await query(`${LOCATION_SELECT_QUERY} WHERE l.id = $1 LIMIT 1`, [trimmed]);
        if (res.rows[0]) return res.rows[0];
      }

      // Fallback by room code or room name
      const resByCode = await query(
        `${LOCATION_SELECT_QUERY} WHERE UPPER(l.code) = UPPER($1) OR UPPER(l.room) = UPPER($1) LIMIT 1`,
        [trimmed]
      );
      return resByCode.rows[0] || null;
    } catch (err: any) {
      throw new DatabaseException(`Failed to lookup location: ${err.message}`, err);
    }
  },

  async findByCode(code: string): Promise<Location | null> {
    if (!code || typeof code !== 'string') return null;
    try {
      const res = await query(`${LOCATION_SELECT_QUERY} WHERE UPPER(l.code) = UPPER($1) LIMIT 1`, [code.trim()]);
      return res.rows[0] || null;
    } catch (err: any) {
      throw new DatabaseException(`Failed to lookup location by code: ${err.message}`, err);
    }
  },

  async create(loc: Omit<Location, 'id' | 'created_at'>): Promise<Location> {
    const res = await query(
      `INSERT INTO locations (code, name, room, building, room_type)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        loc.code.trim().toUpperCase(),
        loc.name.trim(),
        loc.room.trim(),
        loc.building.trim(),
        loc.room_type || 'COMPUTER_LAB',
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
    if (loc.room_type !== undefined) {
      values.push(loc.room_type);
      fields.push(`room_type = $${values.length}`);
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
    if (!isValidUuid(id)) return false;
    const res = await query('DELETE FROM locations WHERE id = $1', [id.trim()]);
    return (res.rowCount ?? 0) > 0;
  },

  async findRoomByInventoryItemId(itemId: string): Promise<{ room_id: string; room: string; name: string } | null> {
    if (!isValidUuid(itemId)) return null;
    const res = await query(
      `SELECT ri.room_id, l.room, l.name
       FROM room_inventory ri
       JOIN locations l ON ri.room_id = l.id
       WHERE ri.id = $1
       LIMIT 1`,
      [itemId.trim()]
    );
    return res.rows[0] || null;
  },

  async findRoomInventoryItemById(itemId: string): Promise<any | null> {
    if (!isValidUuid(itemId)) return null;
    const res = await query('SELECT * FROM room_inventory WHERE id = $1 LIMIT 1', [itemId.trim()]);
    return res.rows[0] || null;
  },

  async getTotalAllocatedUnitsForAsset(assetId: string, excludeItemId?: string): Promise<number> {
    if (!isValidUuid(assetId)) return 0;
    const params: any[] = [assetId.trim()];
    let sql = `
      SELECT COALESCE(SUM(qty_working + qty_broken + qty_maintenance), 0)::int AS total
      FROM room_inventory
      WHERE asset_id = $1
    `;
    if (excludeItemId && isValidUuid(excludeItemId)) {
      params.push(excludeItemId.trim());
      sql += ' AND id <> $2';
    }
    const res = await query(sql, params);
    return Number(res.rows[0]?.total || 0);
  },

  // Room Inventory (Facility Matrix — merges repeated allocations of the same item into one row)
  async addRoomInventoryItem(roomId: string, item: any): Promise<any> {
    const stockItemId = item.stockItemId || item.stock_item_id || null;
    const assetId = item.assetId || item.asset_id || null;
    const addWorking = Number(item.qtyWorking ?? item.qty_working ?? 1) || 0;
    const addBroken = Number(item.qtyBroken ?? item.qty_broken ?? 0) || 0;
    const addMaintenance = Number(item.qtyMaintenance ?? item.qty_maintenance ?? 0) || 0;

    if (stockItemId || assetId) {
      const existingRes = stockItemId
        ? await query(
            `SELECT * FROM room_inventory
             WHERE room_id = $1 AND stock_item_id = $2
             ORDER BY created_at ASC, id ASC`,
            [roomId, stockItemId]
          )
        : await query(
            `SELECT * FROM room_inventory
             WHERE room_id = $1 AND stock_item_id IS NULL AND asset_id = $2
             ORDER BY created_at ASC, id ASC`,
            [roomId, assetId]
          );

      if (existingRes.rows.length > 0) {
        const primary = existingRes.rows[0];
        const totalWorking =
          existingRes.rows.reduce((sum: number, r: any) => sum + Number(r.qty_working || 0), 0) +
          addWorking;
        const totalBroken =
          existingRes.rows.reduce((sum: number, r: any) => sum + Number(r.qty_broken || 0), 0) +
          addBroken;
        const totalMaintenance =
          existingRes.rows.reduce((sum: number, r: any) => sum + Number(r.qty_maintenance || 0), 0) +
          addMaintenance;
        const mergedRemarks = mergeRoomRemarks(
          ...existingRes.rows.map((r: any) => r.remarks),
          item.remarks
        );

        const duplicateIds = existingRes.rows.slice(1).map((r: any) => r.id);
        if (duplicateIds.length > 0) {
          await query('DELETE FROM room_inventory WHERE id = ANY($1::uuid[])', [duplicateIds]);
        }

        const updatedRes = await query(
          `UPDATE room_inventory
           SET qty_working = $1,
               qty_broken = $2,
               qty_maintenance = $3,
               remarks = $4,
               brand_spec = COALESCE($5, brand_spec),
               unit = COALESCE($6, unit),
               last_audited_at = CURRENT_TIMESTAMP,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $7
           RETURNING *`,
          [
            totalWorking,
            totalBroken,
            totalMaintenance,
            mergedRemarks,
            item.brandSpec || item.brand_spec || null,
            item.unit || null,
            primary.id,
          ]
        );
        return updatedRes.rows[0];
      }
    }

    const res = await query(
      `INSERT INTO room_inventory (room_id, stock_item_id, asset_id, name, group_type, brand_spec, unit, qty_working, qty_broken, qty_maintenance, remarks)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        roomId,
        stockItemId,
        assetId,
        item.name,
        item.group || item.group_type || 'FURNITURE',
        item.brandSpec || item.brand_spec || null,
        item.unit || 'pcs',
        addWorking,
        addBroken,
        addMaintenance,
        item.remarks || null,
      ]
    );
    return res.rows[0];
  },

  async updateRoomInventoryCount(itemId: string, field: 'qtyWorking' | 'qtyBroken' | 'qtyMaintenance', delta: number): Promise<any> {
    if (!isValidUuid(itemId)) return null;
    const col = field === 'qtyWorking' ? 'qty_working' : field === 'qtyBroken' ? 'qty_broken' : 'qty_maintenance';
    const res = await query(
      `UPDATE room_inventory SET ${col} = GREATEST(0, ${col} + $1), updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [delta, itemId.trim()]
    );
    return res.rows[0] || null;
  },

  async updateRoomInventoryItem(itemId: string, data: any): Promise<any> {
    if (!isValidUuid(itemId)) return null;
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (data.name !== undefined) {
      fields.push(`name = $${idx++}`);
      values.push(data.name);
    }
    if (data.group !== undefined || data.group_type !== undefined) {
      fields.push(`group_type = $${idx++}`);
      values.push(data.group || data.group_type);
    }
    if (data.brandSpec !== undefined || data.brand_spec !== undefined) {
      fields.push(`brand_spec = $${idx++}`);
      values.push(data.brandSpec ?? data.brand_spec);
    }
    if (data.unit !== undefined) {
      fields.push(`unit = $${idx++}`);
      values.push(data.unit);
    }
    if (data.qtyWorking !== undefined || data.qty_working !== undefined) {
      fields.push(`qty_working = $${idx++}`);
      values.push(data.qtyWorking ?? data.qty_working);
    }
    if (data.qtyBroken !== undefined || data.qty_broken !== undefined) {
      fields.push(`qty_broken = $${idx++}`);
      values.push(data.qtyBroken ?? data.qty_broken);
    }
    if (data.qtyMaintenance !== undefined || data.qty_maintenance !== undefined) {
      fields.push(`qty_maintenance = $${idx++}`);
      values.push(data.qtyMaintenance ?? data.qty_maintenance);
    }
    if (data.remarks !== undefined) {
      fields.push(`remarks = $${idx++}`);
      values.push(data.remarks);
    }
    if (data.stockItemId !== undefined || data.stock_item_id !== undefined) {
      fields.push(`stock_item_id = $${idx++}`);
      values.push(data.stockItemId ?? data.stock_item_id);
    }
    if (data.assetId !== undefined || data.asset_id !== undefined) {
      fields.push(`asset_id = $${idx++}`);
      values.push(data.assetId ?? data.asset_id);
    }

    if (fields.length === 0) {
      const res = await query('SELECT * FROM room_inventory WHERE id = $1', [itemId]);
      return res.rows[0];
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(itemId);

    const sql = `UPDATE room_inventory SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`;
    const res = await query(sql, values);
    return res.rows[0];
  },

  async deleteRoomInventoryItem(itemId: string): Promise<boolean> {
    if (!isValidUuid(itemId)) return false;
    const res = await query('DELETE FROM room_inventory WHERE id = $1', [itemId.trim()]);
    return (res.rowCount ?? 0) > 0;
  },

  async markAudited(roomId: string, auditorName: string): Promise<any> {
    if (!isValidUuid(roomId)) return null;
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
