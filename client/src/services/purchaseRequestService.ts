import { apiClient } from './apiClient';
import { API_ENDPOINTS } from './endpoints';

export const purchaseRequestService = {
  async getPurchaseRequests(params?: { status?: string }): Promise<{ status: string; data: any[] }> {
    return apiClient.get(API_ENDPOINTS.REQUESTS.LIST, { params });
  },

  async getPurchaseRequestById(id: string): Promise<{ status: string; data: any }> {
    return apiClient.get(API_ENDPOINTS.REQUESTS.DETAILS(id));
  },

  async createPurchaseRequest(data: any): Promise<{ status: string; data: any }> {
    return apiClient.post(API_ENDPOINTS.REQUESTS.CREATE, data);
  },

  async updatePurchaseRequest(id: string, data: any): Promise<{ status: string; data: any }> {
    return apiClient.put(API_ENDPOINTS.REQUESTS.UPDATE(id), data);
  },

  async updatePurchaseRequestStatus(id: string, status: string, notes?: string): Promise<{ status: string; data: any }> {
    return apiClient.patch(`${API_ENDPOINTS.REQUESTS.DETAILS(id)}/status`, { status, notes });
  },

  async deletePurchaseRequest(id: string): Promise<{ status: string }> {
    return apiClient.delete(API_ENDPOINTS.REQUESTS.DELETE(id));
  },
};
