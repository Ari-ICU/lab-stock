export interface MockItem {
  id: string;
  serverId?: string;
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
  serverId?: string;
  assetId?: string;
  stockId?: string;
  itemType?: 'asset' | 'stock';
  quantity?: number;
  assetName: string;
  serialNumber: string; // Serial number for asset or SKU for stock item
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
  serverId?: string;
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

export type RoomType =
  | 'COMPUTER_LAB'
  | 'LECTURE_ROOM'
  | 'STAFF_OFFICE'
  | 'SERVER_ROOM'
  | 'STORAGE';

export type AssetGroup =
  | 'FURNITURE'
  | 'ELECTRICAL'
  | 'IT_HARDWARE'
  | 'SAFETY_MISC';

export interface RoomInventoryItem {
  id: string;
  roomId: string;
  stockItemId?: string;
  assetId?: string;
  name: string;
  group: AssetGroup;
  brandSpec?: string;
  unit: string;
  qtyWorking: number;
  qtyBroken: number;
  qtyMaintenance: number;
  remarks?: string;
  lastAuditedAt?: string;
}

export interface MockLocation {
  id: string;
  serverId?: string;
  code?: string;
  name: string;
  building: string;
  room: string;
  type?: RoomType;
  totalAssets: number;
  totalItems: number;
  lastAuditedAt?: string;
  auditedBy?: string;
  inventories?: RoomInventoryItem[];
}

export type AnyEntity =
  | MockItem
  | MockAsset
  | MockRack
  | MockLocation
  | MockLoan
  | MockTransfer
  | RoomInventoryItem;

export type ModalType =
  | 'none'
  | 'add_stock'
  | 'add_asset'
  | 'add_rack'
  | 'add_location'
  | 'lend_asset'
  | 'transfer_asset';
