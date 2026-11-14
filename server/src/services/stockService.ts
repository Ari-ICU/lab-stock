import { stockModel, StockItem } from '../models/stockModel.js';
import { categoryModel } from '../models/categoryModel.js';
import { NotFoundException, ConflictException, ValidationException } from '../exceptions/errorHandler.js';
import { cache } from '../utils/cache.js';
import { resolveLocationIdFromPayload } from '../utils/locationResolver.js';
import { query } from '../config/database.js';

export const stockService = {
  /**
   * Calculate stock status according to business threshold rules
   */
  calculateStatus(quantity: number, threshold = 10): 'in_stock' | 'low_stock' | 'out_of_stock' {
    if (quantity <= 0) return 'out_of_stock';
    if (quantity <= threshold) return 'low_stock';
    return 'in_stock';
  },

  /**
   * Fetch stock list with ultra-fast sub-millisecond in-memory caching.
   * Auto-invalidated whenever any user inserts, updates, or deletes an item.
   */
  async getAll(filters?: { category?: string; status?: string; search?: string }): Promise<StockItem[]> {
    const cacheKey = `stock:list:${filters?.category || 'all'}:${filters?.status || 'all'}:${filters?.search || 'none'}`;
    return cache.getOrSet(cacheKey, () => stockModel.findAll(filters), 60000); // 60s TTL
  },

  async getById(id: string): Promise<StockItem> {
    const item = await stockModel.findById(id);
    if (!item) {
      throw new NotFoundException(`Inventory item with ID ${id}`);
    }
    return item;
  },

  async create(data: any): Promise<StockItem> {
    const code = data.code?.trim();
    const name = data.name?.trim();

    if (!code || !name) {
      throw new ValidationException('Item code/SKU and name are required');
    }

    const existing = await stockModel.findByCode(code);
    if (existing) {
      throw new ConflictException(`Item code / SKU '${code}' is already registered in inventory`);
    }

    const quantity = Number(data.quantity) || 0;
    const threshold = Number(data.min_threshold ?? data.minThreshold ?? 10);
    const calculatedStatus = data.status || this.calculateStatus(quantity, threshold);

    const categoryName = (data.category || 'Office Stationery').trim();
    await categoryModel.ensureExists(categoryName).catch(() => {});

    const { locationId } = await resolveLocationIdFromPayload(data);

    const created = await stockModel.create({
      code,
      name,
      category: categoryName,
      quantity,
      unit: data.unit || 'Units',
      location_id: locationId,
      rack: data.rack || null,
      status: calculatedStatus,
      min_threshold: threshold,
      expiry_date: data.expiry_date || data.expiryDate || 'Active',
      image_url: data.image_url || data.imageUrl || null,
      description: data.description || null,
    });

    // Invalidate stock and location caches so all users immediately see the new item
    cache.invalidatePattern('stock:');
    cache.invalidatePattern('location:');

    return created;
  },

  async update(id: string, data: Partial<StockItem> & Record<string, any>): Promise<StockItem> {
    const current = await this.getById(id);

    const newQuantity = data.quantity !== undefined ? data.quantity : current.quantity;
    const rawThreshold = data.min_threshold ?? data.minThreshold;
    const newThreshold = rawThreshold !== undefined ? Number(rawThreshold) : (current.min_threshold || 10);
    const newStatus = data.status || this.calculateStatus(newQuantity, newThreshold);

    if (data.category) {
      await categoryModel.ensureExists(data.category).catch(() => {});
    }

    const { provided: hasLocationInput, locationId } = await resolveLocationIdFromPayload(data);
    const normalizedUpdate: Partial<StockItem> = {
      ...data,
      min_threshold: rawThreshold !== undefined ? newThreshold : data.min_threshold,
      expiry_date: data.expiry_date ?? data.expiryDate,
      image_url: data.image_url ?? data.imageUrl,
      status: newStatus,
      ...(hasLocationInput ? { location_id: locationId } : {}),
    };

    const updated = await stockModel.update(id, normalizedUpdate);

    if (!updated) {
      throw new NotFoundException(`Inventory item ${id}`);
    }

    // Invalidate stock and location caches
    cache.invalidatePattern('stock:');
    cache.invalidatePattern('location:');

    return updated;
  },

  /**
   * Concurrency-safe atomic adjustment (e.g. usage, restock, checkout)
   */
  async adjustQuantity(id: string, delta: number): Promise<StockItem> {
    if (!Number.isInteger(delta) || delta === 0 || Math.abs(delta) > 1_000_000) {
      throw new ValidationException('Quantity adjustment delta must be a non-zero integer');
    }

    const updated = await stockModel.adjustQuantity(id, delta);
    if (!updated) {
      // Check if item exists or if stock was insufficient
      const item = await stockModel.findById(id);
      if (!item) {
        throw new NotFoundException(`Inventory item ${id}`);
      }
      throw new ConflictException(`Insufficient stock. Cannot reduce quantity by ${Math.abs(delta)} (available: ${item.quantity}).`);
    }

    cache.invalidatePattern('stock:');
    cache.invalidatePattern('location:');
    return updated;
  },

  async delete(id: string): Promise<boolean> {
    const current = await this.getById(id); // ensure exists and resolve UUID
    await query('DELETE FROM room_inventory WHERE stock_item_id = $1', [current.id]);
    const deleted = await stockModel.delete(current.id);
    if (deleted) {
      cache.invalidatePattern('stock:');
      cache.invalidatePattern('location:');
    }
    return deleted;
  },
};
