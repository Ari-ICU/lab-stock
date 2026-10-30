import {
  MockItem,
  MockAsset,
  MockRack,
  MockMaintenance,
  MockLocation,
  MockLoan,
  MockTransfer,
  PurchaseRequest,
} from '@/types';

export type {
  MockItem,
  MockAsset,
  MockRack,
  MockMaintenance,
  MockLocation,
  MockLoan,
  MockTransfer,
  PurchaseRequest,
};

/**
 * All mock data has been purged.
 * All application entities are fetched dynamically from the PostgreSQL backend database.
 */
export const mockStock: MockItem[] = [];
export const mockAssets: MockAsset[] = [];
export const mockRacks: MockRack[] = [];
export const mockMaintenance: MockMaintenance[] = [];
export const mockLocations: MockLocation[] = [];
export const mockLoans: MockLoan[] = [];
export const mockTransfers: MockTransfer[] = [];
export const mockPurchaseRequests: PurchaseRequest[] = [];
