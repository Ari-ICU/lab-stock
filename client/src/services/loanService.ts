/**
 * Device Loans & Equipment Check-out Service Layer
 */

import { apiClient } from './apiClient';
import { API_ENDPOINTS } from './endpoints';

export interface LoanQueryParams {
  status?: 'active' | 'returned' | 'overdue';
  borrower?: string;
  assetId?: string;
  page?: number;
  limit?: number;
}

export interface CheckoutLoanInput {
  asset_id: string;
  borrower_name: string;
  borrower_role: 'Student' | 'Lecturer' | 'Lab Assistant' | 'Technician';
  borrower_contact: string;
  course_class?: string;
  expected_return_date: string;
  checkout_notes?: string;
}

export const loanService = {
  /**
   * Retrieve device loan records (supports status filter: active, returned, overdue)
   */
  async getLoans(params?: LoanQueryParams): Promise<{ status: string; data: any[] }> {
    return apiClient.get(API_ENDPOINTS.LOANS.LIST, { params });
  },

  /**
   * Retrieve single loan record by ID
   */
  async getLoanById(loanId: string): Promise<{ status: string; data: any }> {
    return apiClient.get(API_ENDPOINTS.LOANS.DETAILS(loanId));
  },

  /**
   * Check out hardware device to student, lecturer, or technician
   */
  async checkoutEquipment(loanData: CheckoutLoanInput): Promise<{ status: string; data: any }> {
    return apiClient.post(API_ENDPOINTS.LOANS.CHECKOUT, loanData);
  },

  /**
   * Check in returned device with inspection notes
   */
  async returnEquipment(loanId: string, notes?: string): Promise<{ status: string; data: any }> {
    return apiClient.post(API_ENDPOINTS.LOANS.RETURN(loanId), { notes });
  },
};

