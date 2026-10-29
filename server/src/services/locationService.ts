import { locationModel, Location } from '../models/locationModel.js';
import { NotFoundException, ConflictException, ValidationException } from '../exceptions/errorHandler.js';
import { cache } from '../utils/cache.js';

export const locationService = {
  async getAll(): Promise<Location[]> {
    return cache.getOrSet('location:list:all', () => locationModel.findAll(), 120000); // 2-min TTL
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
};
