/**
 * Central API Endpoints Registry for CSD Stock System
 * Defines all backend gateway route paths and URL builder functions
 */

export const API_ENDPOINTS = {
  // System Telemetry & Gateway
  SYSTEM: {
    HEALTH: '/health',
    ROOT: '/',
  },

  // Authentication & Personnel Access
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    VERIFY: '/auth/verify',
    ME: '/auth/me',
    CHANGE_PASSWORD: '/auth/change-password',
    USERS: '/auth/users',
    USER_ROLE: (userId: string) => `/auth/users/${userId}/role`,
    USER_LABS: (userId: string) => `/auth/users/${userId}/labs`,
    USER_BY_ID: (userId: string) => `/auth/users/${userId}`,
    ADMIN_ZONE: '/auth/admin-only',
    FACULTY_ZONE: '/auth/faculty-only',
  },

  // Hardware Assets & Infrastructure
  ASSETS: {
    LIST: '/assets',
    DETAILS: (assetId: string) => `/assets/${assetId}`,
    CREATE: '/assets',
    UPDATE: (assetId: string) => `/assets/${assetId}`,
    DELETE: (assetId: string) => `/assets/${assetId}`,
  },

  // Inventory Stock & Consumables
  STOCK: {
    LIST: '/stock',
    DETAILS: (stockId: string) => `/stock/${stockId}`,
    CREATE: '/stock',
    UPDATE: (stockId: string) => `/stock/${stockId}`,
    ADJUST_QUANTITY: (stockId: string) => `/stock/${stockId}/quantity`,
    DELETE: (stockId: string) => `/stock/${stockId}`,
  },

  // Device Loans & Checkouts
  LOANS: {
    LIST: '/loans',
    DETAILS: (loanId: string) => `/loans/${loanId}`,
    CHECKOUT: '/loans/checkout',
    RETURN: (loanId: string) => `/loans/${loanId}/return`,
  },

  // Laboratory Locations & Facilities
  LOCATIONS: {
    LIST: '/locations',
    DETAILS: (locationId: string) => `/locations/${locationId}`,
    CREATE: '/locations',
    UPDATE: (locationId: string) => `/locations/${locationId}`,
    DELETE: (locationId: string) => `/locations/${locationId}`,
  },
} as const;

