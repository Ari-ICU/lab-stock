import { apiClient } from './apiClient';
import { API_ENDPOINTS } from './endpoints';

export interface TransferDto {
  id?: string;
  asset_id: string;
  asset_name?: string;
  serial_number?: string;
  from_location_id?: string;
  from_location?: string;
  to_location_id?: string;
  to_location: string;
  transfer_date?: string;
  transferred_by?: string;
  reason?: string;
  quantity?: number;
}

export const transferService = {
  async getTransfers(): Promise<{ status: string; data: any[] }> {
    return apiClient.get(API_ENDPOINTS.TRANSFERS.LIST);
  },

  async getTransferById(id: string): Promise<{ status: string; data: any }> {
    return apiClient.get(API_ENDPOINTS.TRANSFERS.DETAILS(id));
  },

  async createTransfer(data: TransferDto): Promise<{ status: string; data: any }> {
    return apiClient.post(API_ENDPOINTS.TRANSFERS.CREATE, data);
  },
};

