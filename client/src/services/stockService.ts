/**
 * Consumables & Inventory Stock Service Layer
 */

import { apiClient } from './apiClient';
import { API_ENDPOINTS } from './endpoints';

export interface StockQueryParams {
  category?: string;
  status?: string;
  location?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateStockInput {
  name: string;
  code: string;
  category: string;
  quantity: number;
  minQuantity?: number;
  unit: string;
  location: string;
  rack?: string;
  status?: string;
  expiryDate?: string;
  supplier?: string;
}

export const stockService = {
  /**
   * Retrieve all consumable items and peripheral inventory
   */
  async getStockItems(params?: StockQueryParams): Promise<{ status: string; data: any[] }> {
    return apiClient.get(API_ENDPOINTS.STOCK.LIST, { params });
  },

  /**
   * Retrieve single stock item by ID
   */
  async getStockItemById(stockId: string): Promise<{ status: string; data: any }> {
    return apiClient.get(API_ENDPOINTS.STOCK.DETAILS(stockId));
  },

  /**
   * Create a new consumable catalog item
   */
  async createStockItem(stockData: CreateStockInput): Promise<{ status: string; data: any }> {
    return apiClient.post(API_ENDPOINTS.STOCK.CREATE, stockData);
  },

  /**
   * Update full inventory item record
   */
  async updateStockItem(stockId: string, stockData: Partial<CreateStockInput>): Promise<{ status: string; data: any }> {
    return apiClient.put(API_ENDPOINTS.STOCK.UPDATE(stockId), stockData);
  },

  /**
   * Incremental stock quantity adjustment (+/- units) with audit reason
   */
  async adjustStockQuantity(
    stockId: string,
    quantityChange: number,
    reason?: string
  ): Promise<{ status: string; data: any }> {
    return apiClient.patch(API_ENDPOINTS.STOCK.ADJUST_QUANTITY(stockId), {
      quantityChange,
      reason,
    });
  },

  /**
   * Remove item from inventory catalog
   */
  async deleteStockItem(stockId: string): Promise<{ status: string; message: string }> {
    return apiClient.delete(API_ENDPOINTS.STOCK.DELETE(stockId));
  },
};

