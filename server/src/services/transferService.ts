import { query, withTransaction } from '../config/database.js';
import { NotFoundException, ValidationException } from '../exceptions/errorHandler.js';
import { cache } from '../utils/cache.js';

export interface TransferRecord {
  id: string;
  asset_id: string;
  asset_name: string;
  serial_number: string;
  from_location_id?: string;
  from_location: string;
  to_location_id?: string;
  to_location: string;
  transfer_date: string;
  transferred_by: string;
  reason?: string;
  created_at?: string;
}

export const transferService = {
  async getAll(): Promise<TransferRecord[]> {
    const cacheKey = 'transfer:list';
    return cache.getOrSet(
      cacheKey,
      async () => {
        const res = await query(
          `SELECT 
            t.id,
            t.asset_id,
            COALESCE(a.name, 'Lab Hardware Asset') AS asset_name,
            COALESCE(a.serial_number, 'N/A') AS serial_number,
            t.from_location_id,
            COALESCE(fl.name || ' (' || fl.room || ')', fl.name, fl.room, 'Central Depository') AS from_location,
            t.to_location_id,
            COALESCE(tl.name || ' (' || tl.room || ')', tl.name, tl.room, 'Laboratory Facility') AS to_location,
            t.transfer_date::text,
            t.transferred_by,
            t.reason,
            t.created_at
          FROM transfers t
          LEFT JOIN assets a ON t.asset_id = a.id
          LEFT JOIN locations fl ON t.from_location_id = fl.id
          LEFT JOIN locations tl ON t.to_location_id = tl.id
          ORDER BY t.transfer_date DESC, t.created_at DESC`
        );
        return res.rows;
      },
      30000
    );
  },

  async getById(id: string): Promise<TransferRecord> {
    const res = await query(
      `SELECT 
        t.id,
        t.asset_id,
        COALESCE(a.name, 'Lab Hardware Asset') AS asset_name,
        COALESCE(a.serial_number, 'N/A') AS serial_number,
        t.from_location_id,
        COALESCE(fl.name || ' (' || fl.room || ')', fl.name, fl.room, 'Central Depository') AS from_location,
        t.to_location_id,
        COALESCE(tl.name || ' (' || tl.room || ')', tl.name, tl.room, 'Laboratory Facility') AS to_location,
        t.transfer_date::text,
        t.transferred_by,
        t.reason,
        t.created_at
      FROM transfers t
      LEFT JOIN assets a ON t.asset_id = a.id
      LEFT JOIN locations fl ON t.from_location_id = fl.id
      LEFT JOIN locations tl ON t.to_location_id = tl.id
      WHERE t.id::text = $1
      LIMIT 1`,
      [id]
    );

    if (res.rows.length === 0) {
      throw new NotFoundException(`Relocation record with ID ${id}`);
    }

    return res.rows[0];
  },

  async create(data: any): Promise<TransferRecord> {
    const assetId = data.asset_id || data.assetId;
    const toLocationInput = data.to_location || data.toLocation || data.to_location_id || data.toLocationId;
    const fromLocationInput = data.from_location || data.fromLocation || data.from_location_id || data.fromLocationId;
    const transferredBy = data.transferred_by || data.transferredBy || 'Faculty Administrator';
    const reason = data.reason || 'Laboratory workshop equipment relocation';
    const transferDate = data.transfer_date || data.transferDate || new Date().toISOString().split('T')[0];
    const quantity = Number(data.quantity || 1);

    if (!assetId || !toLocationInput) {
      throw new ValidationException('Asset ID and target location are required for relocation');
    }

    return withTransaction(async (client) => {
      // 1. Find asset (by UUID or serial_number)
      const assetRes = await client.query(
        `SELECT id, name, serial_number, model, unit_type, total_units, location_id 
         FROM assets 
         WHERE id::text = $1 OR serial_number = $1
         FOR UPDATE`,
        [assetId]
      );
      if (assetRes.rows.length === 0) {
        throw new NotFoundException(`Asset with identifier ${assetId}`);
      }
      const asset = assetRes.rows[0];

      // 2. Resolve target location ID
      let toLocRes = await client.query(
        `SELECT id, name, room FROM locations WHERE id::text = $1 OR LOWER(room) = LOWER($1) OR LOWER(name) = LOWER($1) OR LOWER(name || ' (' || room || ')') = LOWER($1) LIMIT 1`,
        [toLocationInput]
      );
      if (toLocRes.rows.length === 0) {
        toLocRes = await client.query(
          `SELECT id, name, room FROM locations WHERE $1 ILIKE '%' || room || '%' OR $1 ILIKE '%' || name || '%' LIMIT 1`,
          [toLocationInput]
        );
      }
      const toLoc = toLocRes.rows[0];
      const toLocId = toLoc ? toLoc.id : null;

      // 3. Resolve from location ID
      let fromLocId = asset.location_id;
      if (fromLocationInput) {
        const fromLocRes = await client.query(
          `SELECT id, name, room FROM locations WHERE id::text = $1 OR LOWER(room) = LOWER($1) OR LOWER(name) = LOWER($1) OR $1 ILIKE '%' || room || '%' LIMIT 1`,
          [fromLocationInput]
        );
        if (fromLocRes.rows.length > 0) {
          fromLocId = fromLocRes.rows[0].id;
        }
      }

      // 4. Insert transfer record
      const insertTransferRes = await client.query(
        `INSERT INTO transfers (asset_id, from_location_id, to_location_id, transfer_date, transferred_by, reason)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, asset_id, from_location_id, to_location_id, transfer_date::text, transferred_by, reason, created_at`,
        [asset.id, fromLocId, toLocId, transferDate, transferredBy, reason]
      );
      const transferRow = insertTransferRes.rows[0];

      // 5. Update asset location_id
      if (toLocId) {
        await client.query(`UPDATE assets SET location_id = $1 WHERE id = $2`, [toLocId, asset.id]);
      }

      // 6. Update room_inventories if locations exist
      if (fromLocId && toLocId && fromLocId !== toLocId) {
        // Reduce from origin
        await client.query(
          `UPDATE room_inventories 
           SET qty_working = GREATEST(0, qty_working - $1) 
           WHERE location_id = $2 AND (asset_id = $3 OR LOWER(name) = LOWER($4))`,
          [quantity, fromLocId, asset.id, asset.name]
        );

        // Add or update target
        const existingTargetInv = await client.query(
          `SELECT id, qty_working FROM room_inventories WHERE location_id = $1 AND (asset_id = $2 OR LOWER(name) = LOWER($3)) LIMIT 1`,
          [toLocId, asset.id, asset.name]
        );
        if (existingTargetInv.rows.length > 0) {
          await client.query(
            `UPDATE room_inventories SET qty_working = qty_working + $1 WHERE id = $2`,
            [quantity, existingTargetInv.rows[0].id]
          );
        } else {
          await client.query(
            `INSERT INTO room_inventories (location_id, asset_id, name, item_group, brand_spec, unit, qty_working, qty_broken, qty_maintenance)
             VALUES ($1, $2, $3, 'IT_HARDWARE', $4, $5, $6, 0, 0)`,
            [toLocId, asset.id, asset.name, asset.model || 'Standard Specification', asset.unit_type || 'Units', quantity]
          );
        }
      }

      // Invalidate cache
      cache.invalidatePattern('transfer:');
      cache.invalidatePattern('asset:');
      cache.invalidatePattern('location:');

      return {
        id: transferRow.id,
        asset_id: asset.id,
        asset_name: asset.name,
        serial_number: asset.serial_number,
        from_location_id: fromLocId,
        from_location: fromLocationInput || 'Previous Station',
        to_location_id: toLocId,
        to_location: toLoc ? `${toLoc.name} (${toLoc.room})` : toLocationInput,
        transfer_date: transferRow.transfer_date,
        transferred_by: transferRow.transferred_by,
        reason: transferRow.reason,
        created_at: transferRow.created_at,
      };
    });
  },
};
