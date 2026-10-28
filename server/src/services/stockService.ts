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

  async create(data: Omit<StockItem, 'id' | 'status' | 'created_at' | 'updated_at'> & { status?: StockItem['status'] }): Promise<StockItem> {
    if (!data.code || !data.name) {
      throw new ValidationException('Item code and name are required');
    }

    const existing = await stockModel.findByCode(data.code);
    if (existing) {
      throw new ConflictException(`Item code / SKU '${data.code}' is already registered in inventory`);
    }

    const calculatedStatus = data.status || this.calculateStatus(data.quantity, data.min_threshold || 10);

    return stockModel.create({
      ...data,
      status: calculatedStatus,
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
