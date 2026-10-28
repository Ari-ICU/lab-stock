import { locationModel, Location } from '../models/locationModel.js';
import { NotFoundException, ConflictException, ValidationException } from '../exceptions/errorHandler.js';

export const locationService = {
  async getAll(): Promise<Location[]> {
    return locationModel.findAll();
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

    return locationModel.create(data);
  },
};
