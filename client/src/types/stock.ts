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

export interface MockAsset {
  id: string;
  name: string;
  serialNumber: string;
  model: string;
  totalUnits?: number;
  unitType?: string;
  location: string;
  status: 'operational' | 'in_use' | 'maintenance';
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
}

export type AnyEntity =
  | MockItem
  | MockAsset
  | MockRack
  | MockMaintenance
  | MockLocation;

export type ModalType =
  | 'none'
  | 'add_stock'
  | 'add_asset'
  | 'add_rack'
  | 'add_maintenance'
  | 'add_location';

