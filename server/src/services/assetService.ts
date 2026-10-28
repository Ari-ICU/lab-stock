import { assetModel, Asset } from '../models/assetModel.js';
import { NotFoundException, ConflictException, ValidationException } from '../exceptions/errorHandler.js';

export const assetService = {
  async getAll(filters?: { status?: string; search?: string }): Promise<Asset[]> {
    return assetModel.findAll(filters);
  },

  async getById(id: string): Promise<Asset> {
    const asset = await assetModel.findById(id);
    if (!asset) {
      throw new NotFoundException(`Asset with ID ${id}`);
    }
    return asset;
  },

  async create(data: Omit<Asset, 'id' | 'created_at' | 'updated_at'>): Promise<Asset> {
    if (!data.serial_number || !data.name) {
      throw new ValidationException('Serial number and equipment name are required');
    }

    const existing = await assetModel.findBySerial(data.serial_number);
    if (existing) {
      throw new ConflictException(`Device with serial number '${data.serial_number}' is already registered`);
    }

    return assetModel.create({
      ...data,
      status: data.status || 'operational',
      loan_status: data.loan_status || 'available',
    });
  },

  async update(id: string, data: Partial<Asset>): Promise<Asset> {
    await this.getById(id);
    const updated = await assetModel.update(id, data);
    if (!updated) {
      throw new NotFoundException(`Asset ${id}`);
    }
    return updated;
  },

  async delete(id: string): Promise<boolean> {
    await this.getById(id);
    return assetModel.delete(id);
  },
};
