import { locationModel, Location } from '../models/locationModel.js';
import { stockModel } from '../models/stockModel.js';
import { assetModel } from '../models/assetModel.js';
import { NotFoundException, ConflictException, ValidationException } from '../exceptions/errorHandler.js';
import { cache } from '../utils/cache.js';

export const locationService = {
  async getAll(): Promise<Location[]> {
    return cache.getOrSet('location:list:all', () => locationModel.findAll(), 30000); // 30-sec TTL
  },

  async getById(id: string): Promise<Location> {
    const loc = await locationModel.findById(id);
    if (!loc) {
      throw new NotFoundException(`Location ${id}`);
    }
    return loc;
  },

  async create(data: Omit<Location, 'id' | 'created_at'>): Promise<Location> {
    if (!data.code || !data.name || !data.room || !data.building) {
      throw new ValidationException('Location code, name, room, and building are required');
    }

    const existing = await locationModel.findByCode(data.code);
    if (existing) {
      throw new ConflictException(`Location with code '${data.code}' already exists`);
    }

    const created = await locationModel.create(data);
    cache.invalidatePattern('location:');
    return created;
  },

  async update(id: string, data: Partial<Location>): Promise<Location> {
    const existing = await this.getById(id);
    const updated = await locationModel.update(existing.id, data);
    if (!updated) {
      throw new NotFoundException(`Location with ID ${id}`);
    }
    cache.invalidatePattern('location:');
    cache.invalidatePattern('stock:');
    cache.invalidatePattern('asset:');
    return updated;
  },

  async delete(id: string): Promise<boolean> {
    const existing = await this.getById(id);
    const deleted = await locationModel.delete(existing.id);
    if (deleted) {
      cache.invalidatePattern('location:');
      cache.invalidatePattern('stock:');
      cache.invalidatePattern('asset:');
    }
    return deleted;
  },

  // Room Inventory (Facility Matrix — strictly linked to an existing Stock item or Hardware Asset)
  async addRoomInventoryItem(roomId: string, item: any): Promise<any> {
    const existing = await this.getById(roomId);

    const stockRef = item.stockItemId || item.stock_item_id || item.stockCode;
    const assetRef = item.assetId || item.asset_id || item.serialNumber;

    let resolvedStockId: string | null = null;
    if (stockRef && typeof stockRef === 'string') {
      const stockRow = await stockModel.findById(stockRef);
      if (stockRow) resolvedStockId = stockRow.id;
    }

    let resolvedAssetId: string | null = null;
    let resolvedAssetRow: any = null;
    if (assetRef && typeof assetRef === 'string') {
      const assetRow = await assetModel.findById(assetRef);
      if (assetRow) {
        resolvedAssetId = assetRow.id;
        resolvedAssetRow = assetRow;
      }
    }

    if (!resolvedStockId && !resolvedAssetId) {
      throw new ValidationException(
        'Classroom inventory items must be linked to an existing Inventory item (/stock) or Hardware Asset (/assets).'
      );
    }

    const addWorking = Number(item.qtyWorking ?? item.qty_working ?? 1) || 0;
    const addBroken = Number(item.qtyBroken ?? item.qty_broken ?? 0) || 0;
    const addMaintenance = Number(item.qtyMaintenance ?? item.qty_maintenance ?? 0) || 0;
    const totalDelta = addWorking + addBroken + addMaintenance;

    if (totalDelta < 1) {
      throw new ValidationException('At least 1 unit must be assigned to the classroom.');
    }

    if (resolvedAssetId && resolvedAssetRow) {
      const assetTotal = Math.max(1, Number(resolvedAssetRow.total_units || 1));
      const currentlyAllocated = await locationModel.getTotalAllocatedUnitsForAsset(resolvedAssetId);
      if (currentlyAllocated + totalDelta > assetTotal) {
        const remaining = Math.max(0, assetTotal - currentlyAllocated);
        throw new ValidationException(
          `Cannot assign ${totalDelta} unit(s) of "${resolvedAssetRow.name}". Only ${remaining} of ${assetTotal} total unit(s) remain unassigned.`
        );
      }
    }

    const created = await locationModel.addRoomInventoryItem(existing.id, {
      ...item,
      stockItemId: resolvedStockId,
      assetId: resolvedAssetId,
    });
    cache.invalidatePattern('location:');
    if (resolvedAssetId) cache.invalidatePattern('asset:');
    return created;
  },

  async updateRoomInventoryCount(itemId: string, field: 'qtyWorking' | 'qtyBroken' | 'qtyMaintenance', delta: number): Promise<any> {
    const existingItem = await locationModel.findRoomInventoryItemById(itemId);
    if (!existingItem) {
      throw new NotFoundException(`Room inventory item ${itemId}`);
    }

    if (existingItem.asset_id && delta > 0) {
      const assetRow = await assetModel.findById(existingItem.asset_id);
      if (assetRow) {
        const assetTotal = Math.max(1, Number(assetRow.total_units || 1));
        const currentlyAllocated = await locationModel.getTotalAllocatedUnitsForAsset(existingItem.asset_id);
        if (currentlyAllocated + delta > assetTotal) {
          const remaining = Math.max(0, assetTotal - currentlyAllocated);
          throw new ValidationException(
            `Cannot add ${delta} more unit(s) of "${assetRow.name}". Only ${remaining} of ${assetTotal} total unit(s) remain unassigned.`
          );
        }
      }
    }

    const updated = await locationModel.updateRoomInventoryCount(itemId, field, delta);
    if (!updated) {
      throw new NotFoundException(`Room inventory item ${itemId}`);
    }
    cache.invalidatePattern('location:');
    if (existingItem.asset_id) cache.invalidatePattern('asset:');
    return updated;
  },

  async updateRoomInventoryItem(itemId: string, data: any): Promise<any> {
    const existingItem = await locationModel.findRoomInventoryItemById(itemId);
    if (!existingItem) {
      throw new NotFoundException(`Room inventory item ${itemId}`);
    }

    const targetAssetId = data.assetId ?? data.asset_id ?? existingItem.asset_id;
    if (targetAssetId) {
      const assetRow = await assetModel.findById(targetAssetId);
      if (assetRow) {
        const nextWorking = Number(data.qtyWorking ?? data.qty_working ?? existingItem.qty_working ?? 0) || 0;
        const nextBroken = Number(data.qtyBroken ?? data.qty_broken ?? existingItem.qty_broken ?? 0) || 0;
        const nextMaintenance = Number(data.qtyMaintenance ?? data.qty_maintenance ?? existingItem.qty_maintenance ?? 0) || 0;
        const nextTotal = nextWorking + nextBroken + nextMaintenance;
        const assetTotal = Math.max(1, Number(assetRow.total_units || 1));
        const otherAllocated = await locationModel.getTotalAllocatedUnitsForAsset(targetAssetId, itemId);
        if (otherAllocated + nextTotal > assetTotal) {
          const maxForRoom = Math.max(0, assetTotal - otherAllocated);
          throw new ValidationException(
            `Cannot allocate ${nextTotal} unit(s) of "${assetRow.name}" here. Maximum available including this room's current units is ${maxForRoom} of ${assetTotal}.`
          );
        }
      }
    }

    const updated = await locationModel.updateRoomInventoryItem(itemId, data);
    if (!updated) {
      throw new NotFoundException(`Room inventory item ${itemId}`);
    }
    cache.invalidatePattern('location:');
    if (targetAssetId || existingItem.asset_id) cache.invalidatePattern('asset:');
    return updated;
  },

  async deleteRoomInventoryItem(itemId: string): Promise<boolean> {
    const existingItem = await locationModel.findRoomInventoryItemById(itemId);
    const deleted = await locationModel.deleteRoomInventoryItem(itemId);
    if (!deleted) {
      throw new NotFoundException(`Room inventory item ${itemId}`);
    }
    cache.invalidatePattern('location:');
    if (existingItem?.asset_id) cache.invalidatePattern('asset:');
    return deleted;
  },

  async markAudited(roomId: string, auditorName: string): Promise<any> {
    const existing = await this.getById(roomId);
    const updated = await locationModel.markAudited(existing.id, auditorName);
    cache.invalidatePattern('location:');
    return updated;
  },
};
