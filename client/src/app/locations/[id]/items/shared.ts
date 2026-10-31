import { AssetGroup, MockLocation, MockItem, MockAsset, RoomInventoryItem } from '@/types';

/** Static params for room-level item pages (required for static export builds). */
export const LOCATION_STATIC_PARAMS = [
  { id: '1' },
  { id: '07cf0336-1b6b-45f1-9d53-89910fca337c' },
  { id: 'LOC-102B' },
  { id: 'LOC-206' },
  { id: 'LOC-201' },
  { id: 'LOC-203' },
  { id: 'LOC-305' },
  { id: 'LOC-102' },
  { id: 'L1' },
  { id: 'L2' },
  { id: 'L3' },
  { id: 'L4' },
  { id: 'L5' },
  { id: 'L6' },
];

export const categoryGroupOptions = [
  { label: 'Furniture & Fixtures', value: 'FURNITURE' },
  { label: 'Electrical & HVAC', value: 'ELECTRICAL' },
  { label: 'Lab & IT Hardware', value: 'IT_HARDWARE' },
  { label: 'Safety & Misc', value: 'SAFETY_MISC' },
];

export const conditionStatusOptions = [
  { label: '100% Operational', value: 'operational' },
  { label: 'Defective / Needs Repair', value: 'defective' },
  { label: 'Under Maintenance / Service', value: 'maintenance' },
];

export function getCategoryLabel(group: AssetGroup | string) {
  return categoryGroupOptions.find((o) => o.value === group)?.label || 'General';
}

export function findLocation(locations: MockLocation[], id: string): MockLocation | undefined {
  const norm = (s: string) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  return locations.find(
    (l) =>
      l.id === id ||
      l.serverId === id ||
      l.code === id ||
      norm(l.room) === norm(id)
  );
}

export function findLinkedStock(item: RoomInventoryItem, stock: MockItem[]) {
  if (item.stockItemId) {
    return stock.find((s) => s.id === item.stockItemId || s.code === item.stockItemId);
  }
  return undefined;
}

export function findLinkedAsset(item: RoomInventoryItem, assets: MockAsset[]) {
  if (item.assetId) {
    return assets.find((a) => a.id === item.assetId || a.serialNumber === item.assetId);
  }
  return undefined;
}

export function getConditionStatus(item: Pick<RoomInventoryItem, 'qtyBroken' | 'qtyMaintenance'>) {
  if ((item.qtyBroken || 0) > 0) return 'defective';
  if ((item.qtyMaintenance || 0) > 0) return 'maintenance';
  return 'operational';
}

export function getOperationalPercent(item: Pick<RoomInventoryItem, 'qtyWorking' | 'qtyBroken' | 'qtyMaintenance'>) {
  const total = (item.qtyWorking || 0) + (item.qtyBroken || 0) + (item.qtyMaintenance || 0);
  return total > 0 ? Math.round(((item.qtyWorking || 0) / total) * 100) : 100;
}

