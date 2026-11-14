import { assetModel, Asset } from '../models/assetModel.js';
import { NotFoundException, ConflictException, ValidationException } from '../exceptions/errorHandler.js';
import { cache } from '../utils/cache.js';
import { resolveLocationIdFromPayload } from '../utils/locationResolver.js';
import { query } from '../config/database.js';

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

    const { locationId } = await resolveLocationIdFromPayload(data);

    const created = await assetModel.create({
      serial_number: serial,
      name,
      model,
      total_units: Number(data.total_units || data.totalUnits) || 1,
      unit_type: data.unit_type || data.unitType || 'Units',
      location_id: locationId,
      placement_rack: data.placement_rack || data.placementRack || data.rack || null,
      status: data.status || 'operational',
      loan_status: data.loan_status || data.loanStatus || 'available',
      current_borrower: data.current_borrower || data.currentBorrower || null,
      loan_due_date: data.loan_due_date || data.loanDueDate || null,
      next_calibration: data.next_calibration || data.nextCalibration || null,
      image_url: data.image_url || data.imageUrl || null,
      description: data.description || null,
    });

    // Invalidate asset and location caches instantly
    cache.invalidatePattern('asset:');
    cache.invalidatePattern('location:');

    return created;
  },

  async update(id: string, data: Partial<Asset> & Record<string, any>): Promise<Asset> {
    await this.getById(id);
    const { provided: hasLocationInput, locationId } = await resolveLocationIdFromPayload(data);
    const normalizedUpdate: Partial<Asset> = {
      ...data,
      total_units: data.total_units ?? data.totalUnits,
      unit_type: data.unit_type ?? data.unitType,
      placement_rack: data.placement_rack ?? data.placementRack ?? data.rack,
      loan_status: data.loan_status ?? data.loanStatus,
      current_borrower: data.current_borrower ?? data.currentBorrower,
      loan_due_date: data.loan_due_date ?? data.loanDueDate,
      next_calibration: data.next_calibration ?? data.nextCalibration,
      image_url: data.image_url ?? data.imageUrl,
      ...(hasLocationInput ? { location_id: locationId } : {}),
    };

    const updated = await assetModel.update(id, normalizedUpdate);
    if (!updated) {
      throw new NotFoundException(`Asset ${id}`);
    }

    // Invalidate asset and location caches
    cache.invalidatePattern('asset:');
    cache.invalidatePattern('location:');

    return updated;
  },

  async delete(id: string): Promise<boolean> {
    const current = await this.getById(id);
    await query('DELETE FROM room_inventory WHERE asset_id = $1', [current.id]);
    const deleted = await assetModel.delete(current.id);
    if (deleted) {
      cache.invalidatePattern('asset:');
      cache.invalidatePattern('location:');
    }
    return deleted;
  },
};
