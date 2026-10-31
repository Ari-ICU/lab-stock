import { locationModel, Location } from '../models/locationModel.js';
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
    await this.getById(id);
    const updated = await locationModel.update(id, data);
    if (!updated) {
      throw new NotFoundException(`Location with ID ${id}`);
    }
    cache.invalidatePattern('location:');
    return updated;
  },

  async delete(id: string): Promise<boolean> {
    await this.getById(id);
    const deleted = await locationModel.delete(id);
    if (deleted) {
      cache.invalidatePattern('location:');
    }
    return deleted;
  },

  // Room Inventory (Facility Matrix)
  async addRoomInventoryItem(roomId: string, item: any): Promise<any> {
    await this.getById(roomId);
    const created = await locationModel.addRoomInventoryItem(roomId, item);
    cache.invalidatePattern('location:');
    return created;
  },

  async updateRoomInventoryCount(itemId: string, field: 'qtyWorking' | 'qtyBroken' | 'qtyMaintenance', delta: number): Promise<any> {
    const updated = await locationModel.updateRoomInventoryCount(itemId, field, delta);
    cache.invalidatePattern('location:');
    return updated;
  },

  async updateRoomInventoryItem(itemId: string, data: any): Promise<any> {
    const updated = await locationModel.updateRoomInventoryItem(itemId, data);
    cache.invalidatePattern('location:');
    return updated;
  },

  async deleteRoomInventoryItem(itemId: string): Promise<boolean> {
    const deleted = await locationModel.deleteRoomInventoryItem(itemId);
    cache.invalidatePattern('location:');
    return deleted;
  },

  async markAudited(roomId: string, auditorName: string): Promise<any> {
    const updated = await locationModel.markAudited(roomId, auditorName);
    cache.invalidatePattern('location:');
    return updated;
  },
};
