import { stockModel, StockItem } from '../models/stockModel.js';
import { NotFoundException, ConflictException, ValidationException } from '../exceptions/errorHandler.js';

export const stockService = {
  /**
   * Calculate stock status according to business threshold rules
   */
  calculateStatus(quantity: number, threshold = 10): 'in_stock' | 'low_stock' | 'out_of_stock' {
    if (quantity <= 0) return 'out_of_stock';
    if (quantity <= threshold) return 'low_stock';
    return 'in_stock';
  },

  async getAll(filters?: { category?: string; status?: string; search?: string }): Promise<StockItem[]> {
    return stockModel.findAll(filters);
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

    return stockModel.create({
      code,
      name,
      category: data.category || 'Office Stationery',
      quantity,
      unit: data.unit || 'Units',
      location_id: data.location_id || data.locationId || null,
      rack: data.rack || data.location || null,
      status: calculatedStatus,
      min_threshold: threshold,
      expiry_date: data.expiry_date || data.expiryDate || 'Active',
      image_url: data.image_url || data.imageUrl || null,
      description: data.description || null,
    });
  },

  async update(id: string, data: Partial<StockItem>): Promise<StockItem> {
    const current = await this.getById(id);

    const newQuantity = data.quantity !== undefined ? data.quantity : current.quantity;
    const newThreshold = data.min_threshold !== undefined ? data.min_threshold : (current.min_threshold || 10);
    const newStatus = data.status || this.calculateStatus(newQuantity, newThreshold);

    const updated = await stockModel.update(id, {
      ...data,
      status: newStatus,
    });

    if (!updated) {
      throw new NotFoundException(`Inventory item ${id}`);
    }
    return updated;
  },

  async delete(id: string): Promise<boolean> {
    await this.getById(id); // ensure exists
    return stockModel.delete(id);
  },
};
