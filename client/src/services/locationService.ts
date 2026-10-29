/**
 * Laboratory Locations & Facilities Service Layer
 */

import { apiClient } from './apiClient';
import { API_ENDPOINTS } from './endpoints';

export interface CreateLocationInput {
  name: string;
  room: string;
  building: string;
  capacity?: number;
  description?: string;
}

export const locationService = {
  /**
   * Retrieve all registered university laboratory locations
   */
  async getLocations(): Promise<{ status: string; data: any[] }> {
    return apiClient.get(API_ENDPOINTS.LOCATIONS.LIST);
  },

  /**
   * Retrieve single laboratory room details
   */
  async getLocationById(locationId: string): Promise<{ status: string; data: any }> {
    return apiClient.get(API_ENDPOINTS.LOCATIONS.DETAILS(locationId));
  },

  /**
   * Provision a new laboratory room facility (Admin only)
   */
  async createLocation(locationData: CreateLocationInput): Promise<{ status: string; data: any }> {
    return apiClient.post(API_ENDPOINTS.LOCATIONS.CREATE, locationData);
  },

  /**
   * Update laboratory room parameters (Assigned Operator or Admin)
   */
  async updateLocation(
    locationId: string,
    locationData: Partial<CreateLocationInput>
  ): Promise<{ status: string; data: any }> {
    return apiClient.put(API_ENDPOINTS.LOCATIONS.UPDATE(locationId), locationData);
  },

  /**
   * Decommission a laboratory room (Admin only)
   */
  async deleteLocation(locationId: string): Promise<{ status: string; message: string }> {
    return apiClient.delete(API_ENDPOINTS.LOCATIONS.DELETE(locationId));
  },
};

