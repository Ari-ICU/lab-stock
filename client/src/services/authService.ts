/**
 * Authentication & Personnel Service Layer
 */

import { apiClient } from './apiClient';
import { API_ENDPOINTS } from './endpoints';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterUserData {
  name: string;
  email: string;
  password: string;
  role?: string;
  department?: string;
  is_admin?: boolean;
  assigned_labs?: string[];
}

export interface AuthResponse {
  status: string;
  message?: string;
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    is_admin: boolean;
    department?: string | null;
    assigned_labs?: string[];
    permissions?: string[];
  };
}

export const authService = {
  /**
   * Authenticate credentials and obtain JWT token
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>(API_ENDPOINTS.AUTH.LOGIN, credentials);
  },

  /**
   * Provision a new operator account (Admin only)
   */
  async register(userData: RegisterUserData): Promise<{ status: string; user: any }> {
    return apiClient.post(API_ENDPOINTS.AUTH.REGISTER, userData);
  },

  /**
   * Cryptographically verify active JWT token
   */
  async verifyToken(token?: string): Promise<{ status: string; valid: boolean; payload: any }> {
    return apiClient.post(API_ENDPOINTS.AUTH.VERIFY, { token });
  },

  /**
   * Fetch active session user profile
   */
  async getProfile(): Promise<{ status: string; user: any }> {
    return apiClient.get(API_ENDPOINTS.AUTH.ME);
  },

  /**
   * Update authenticated user password
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<{ status: string; message: string }> {
    return apiClient.post(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, {
      currentPassword,
      newPassword,
    });
  },

  /**
   * List all registered personnel (Admin & authenticated)
   */
  async getUsers(): Promise<{ status: string; count: number; users: any[] }> {
    return apiClient.get(API_ENDPOINTS.AUTH.USERS);
  },

  /**
   * Update role and admin authority for a user (Admin only)
   */
  async updateUserRole(userId: string, role: string): Promise<{ status: string; message: string; data: any }> {
    return apiClient.patch(API_ENDPOINTS.AUTH.USER_ROLE(userId), { role });
  },

  /**
   * Update assigned laboratory room scopes (Admin only)
   */
  async updateUserAssignedLabs(userId: string, assignedLabs: string[]): Promise<{ status: string; message: string; data: any }> {
    return apiClient.patch(API_ENDPOINTS.AUTH.USER_LABS(userId), { assignedLabs });
  },

  /**
   * Delete user account (Admin only)
   */
  async deleteUser(userId: string): Promise<{ status: string; message: string }> {
    return apiClient.delete(API_ENDPOINTS.AUTH.USER_BY_ID(userId));
  },
};

