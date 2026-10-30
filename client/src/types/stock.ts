export interface MockItem {
  id: string;
  name: string;
  code: string;
  category: string;
  quantity: number;
  unit: string;
  location: string;
  rack: string;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  expiryDate: string; // or warranty/inspection date
  imageUrl?: string;
  description?: string;
}

export interface MockLoan {
  id: string;
  assetId: string;
  assetName: string;
  serialNumber: string;
  borrowerName: string;
  borrowerRole: 'Student' | 'Lecturer' | 'Lab Assistant' | 'Technician';
  borrowerContact: string; // email or phone or student ID
  courseOrClass?: string;
  borrowDate: string; // YYYY-MM-DD
  expectedReturnDate: string; // YYYY-MM-DD
  actualReturnDate?: string;
  status: 'active' | 'returned' | 'overdue';
  notes?: string;
}

export interface MockTransfer {
  id: string;
  assetId: string;
  assetName: string;
  serialNumber: string;
  fromLocation: string;
  toLocation: string;
  transferDate: string;
  transferredBy: string;
  reason?: string;
}

export interface MockAsset {
  id: string;
  name: string;
  serialNumber: string;
  model: string;
  totalUnits?: number;
  unitType?: string;
  location: string;
  status: 'operational' | 'in_use' | 'maintenance';
  loanStatus?: 'available' | 'on_loan';
  currentBorrower?: string;
  loanDueDate?: string;
  nextCalibration: string; // firmware audit / cert date
  imageUrl?: string;
  description?: string;
}

export interface MockRack {
  id: string;
  name: string;
  code: string;
  type: '42U Server Rack' | '24U Wall Mount' | 'IDF Distribution' | 'Storage Shelf';
  temperature?: string;
  location: string;
  totalSlots: number;
  usedSlots: number;
}

export interface MockMaintenance {
  id: string;
  assetName: string;
  serialNumber: string;
  type: 'Firmware Upgrade' | 'Port Audit' | 'Hardware RMA' | 'Power Supply Replacement';
  date: string;
  technician: string;
  status: 'Completed' | 'Pending' | 'In Progress';
  notes: string;
}

export interface MockLocation {
  id: string;
  name: string;
  building: string;
  room: string;
  totalAssets: number;
  totalItems: number;
  imageUrl?: string;
}

export interface PurchaseRequest {
  id: string;
  title: string;
  category: string;
  targetRoom: string;
  quantity: number;
  unit: string;
  estimatedCost?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'approved' | 'ordered' | 'fulfilled' | 'rejected';
  reason: string;
  requestedBy: string;
  requesterRole: string;
  supervisedBy?: string;
  requestDate: string;
  imageUrl?: string;
  notes?: string;
}

export type AnyEntity =
  | MockItem
  | MockAsset
  | MockRack
  | MockMaintenance
  | MockLocation
  | MockLoan
  | MockTransfer
  | PurchaseRequest;

export type ModalType =
  | 'none'
  | 'add_stock'
  | 'add_asset'
  | 'add_rack'
  | 'add_maintenance'
  | 'add_location'
  | 'lend_asset'
  | 'transfer_asset';
