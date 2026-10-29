import { assetModel, Asset } from '../models/assetModel.js';
import { NotFoundException, ConflictException, ValidationException } from '../exceptions/errorHandler.js';
import { cache } from '../utils/cache.js';

export const assetService = {
  /**
   * Fast retrieval with in-memory cache and 60-second TTL
   */
  async getAll(filters?: { status?: string; search?: string }): Promise<Asset[]> {
    const cacheKey = `asset:list:${filters?.status || 'all'}:${filters?.search || 'none'}`;
    return cache.getOrSet(cacheKey, () => assetModel.findAll(filters), 60000);
  },

  async getById(id: string): Promise<Asset> {
    const asset = await assetModel.findById(id);
    if (!asset) {
      throw new NotFoundException(`Asset with ID ${id}`);
    }
    return asset;
  },

  async create(data: any): Promise<Asset> {
    const serial = (data.serial_number || data.serialNumber || data.serial)?.trim();
    const name = data.name?.trim();
    const model = data.model?.trim();

    if (!serial || !name || !model) {
      throw new ValidationException('Serial number, equipment name, and model are required');
    }

    const existing = await assetModel.findBySerial(serial);
    if (existing) {
      throw new ConflictException(`Device with serial number '${serial}' is already registered`);
    }

    const created = await assetModel.create({
      serial_number: serial,
      name,
      model,
      total_units: Number(data.total_units || data.totalUnits) || 1,
      unit_type: data.unit_type || data.unitType || 'Units',
      location_id: data.location_id || data.locationId || null,
      placement_rack: data.placement_rack || data.placementRack || data.rack || data.location || null,
      status: data.status || 'operational',
      loan_status: data.loan_status || data.loanStatus || 'available',
      current_borrower: data.current_borrower || data.currentBorrower || null,
      loan_due_date: data.loan_due_date || data.loanDueDate || null,
      next_calibration: data.next_calibration || data.nextCalibration || null,
      image_url: data.image_url || data.imageUrl || null,
      description: data.description || null,
    });

    // Invalidate asset cache instantly
    cache.invalidatePattern('asset:');

    return created;
  },

  async update(id: string, data: Partial<Asset>): Promise<Asset> {
    await this.getById(id);
    const updated = await assetModel.update(id, data);
    if (!updated) {
      throw new NotFoundException(`Asset ${id}`);
    }

    // Invalidate asset cache
    cache.invalidatePattern('asset:');

    return updated;
  },

  async delete(id: string): Promise<boolean> {
    await this.getById(id);
    const deleted = await assetModel.delete(id);
    if (deleted) {
      cache.invalidatePattern('asset:');
    }
    return deleted;
  },
};
