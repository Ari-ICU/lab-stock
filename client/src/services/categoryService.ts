import { apiClient } from './apiClient';
import { API_ENDPOINTS } from './endpoints';

export interface BackendCategory {
  id: string;
  name: string;
  description?: string | null;
}

export const categoryService = {
  async getAll(): Promise<BackendCategory[]> {
    const res = await apiClient.get<{ success: boolean; data: BackendCategory[] }>(
      API_ENDPOINTS.CATEGORIES.LIST
    );
    return res.data || [];
  },

  async create(name: string, description?: string): Promise<BackendCategory> {
    const res = await apiClient.post<{ success: boolean; data: BackendCategory }>(
      API_ENDPOINTS.CATEGORIES.CREATE,
      { name, description }
    );
    return res.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.CATEGORIES.DELETE(id));
  },
};

