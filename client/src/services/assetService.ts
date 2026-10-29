/**
 * Hardware Assets & Equipment Service Layer
 */

import { apiClient } from './apiClient';
import { API_ENDPOINTS } from './endpoints';

export interface AssetQueryParams {
  status?: string;
  category?: string;
  location?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateAssetInput {
  name: string;
  model: string;
  serialNumber: string;
  category: string;
  status?: string;
  location: string;
  unitType?: string;
  totalUnits?: number;
  availableUnits?: number;
  conditionNotes?: string;
  ipAddress?: string;
  macAddress?: string;
}

export const assetService = {
  /**
   * Retrieve hardware asset fleet with optional search and filters
   */
  async getAssets(params?: AssetQueryParams): Promise<{ status: string; data: any[] }> {
    return apiClient.get(API_ENDPOINTS.ASSETS.LIST, { params });
  },

  /**
   * Retrieve single asset specification by primary ID
   */
  async getAssetById(assetId: string): Promise<{ status: string; data: any }> {
    return apiClient.get(API_ENDPOINTS.ASSETS.DETAILS(assetId));
  },

  /**
   * Register a new hardware equipment unit (requires location scope)
   */
  async createAsset(assetData: CreateAssetInput): Promise<{ status: string; data: any }> {
    return apiClient.post(API_ENDPOINTS.ASSETS.CREATE, assetData);
  },

  /**
   * Update existing hardware asset parameters (requires location scope)
   */
  async updateAsset(assetId: string, assetData: Partial<CreateAssetInput>): Promise<{ status: string; data: any }> {
    return apiClient.put(API_ENDPOINTS.ASSETS.UPDATE(assetId), assetData);
  },

  /**
   * Decommission and delete a hardware asset record
   */
  async deleteAsset(assetId: string): Promise<{ status: string; message: string }> {
    return apiClient.delete(API_ENDPOINTS.ASSETS.DELETE(assetId));
  },
};

