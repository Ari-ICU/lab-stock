import { apiClient } from './apiClient';
import { API_ENDPOINTS } from './endpoints';

export interface MaintenanceRecordDto {
  id?: string;
  asset_id?: string;
  asset_name: string;
  serial_number: string;
  type: string;
  date: string;
  technician: string;
  status: 'Completed' | 'Pending' | 'In Progress';
  notes?: string;
}

export const maintenanceService = {
  async getMaintenance(params?: { status?: string }): Promise<{ status: string; data: any[] }> {
    return apiClient.get(API_ENDPOINTS.MAINTENANCE.LIST, { params });
  },

  async getMaintenanceById(id: string): Promise<{ status: string; data: any }> {
    return apiClient.get(API_ENDPOINTS.MAINTENANCE.DETAILS(id));
  },

  async createMaintenance(data: MaintenanceRecordDto): Promise<{ status: string; data: any }> {
    return apiClient.post(API_ENDPOINTS.MAINTENANCE.CREATE, data);
  },

  async updateMaintenance(id: string, data: Partial<MaintenanceRecordDto>): Promise<{ status: string; data: any }> {
    return apiClient.put(API_ENDPOINTS.MAINTENANCE.UPDATE(id), data);
  },

  async deleteMaintenance(id: string): Promise<{ status: string }> {
    return apiClient.delete(API_ENDPOINTS.MAINTENANCE.DELETE(id));
  },
};

