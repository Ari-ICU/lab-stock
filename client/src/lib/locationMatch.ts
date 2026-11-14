import { MockAsset, MockItem, MockLocation, RoomInventoryItem } from '@/types';

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Determine whether an Inventory (/stock) or Hardware Asset (/assets) location string
 * belongs to a given Classroom / Laboratory facility.
 * Rejects empty and "Unassigned" strings, and uses word-boundary room matching
 * so "Room 102" never falsely matches "Room 102B".
 */
export function doesLocationMatchRoom(
  locationText: string | undefined | null,
  loc: Pick<MockLocation, 'room' | 'name' | 'code'>
): boolean {
  if (!locationText) return false;
  const trimmed = locationText.trim();
  if (!trimmed || trimmed.toLowerCase() === 'unassigned') return false;

  const lower = trimmed.toLowerCase();
  const roomLower = (loc.room || '').trim().toLowerCase();
  const nameLower = (loc.name || '').trim().toLowerCase();
  const codeLower = (loc.code || '').trim().toLowerCase();

  if (
    (codeLower && lower === codeLower) ||
    (roomLower && lower === roomLower) ||
    (nameLower && lower === nameLower) ||
    (nameLower && roomLower && lower === `${nameLower} (${roomLower})`)
  ) {
    return true;
  }

  const roomKey = (loc.room || '').replace(/^(rm|room)\s*/i, '').trim().toLowerCase();
  const roomKeyRegex = roomKey ? new RegExp(`\\b${escapeRegex(roomKey)}\\b`, 'i') : null;
  const fullRoomRegex = roomLower ? new RegExp(`\\b${escapeRegex(roomLower)}\\b`, 'i') : null;

  return (
    (roomKeyRegex ? roomKeyRegex.test(trimmed) : false) ||
    (fullRoomRegex ? fullRoomRegex.test(trimmed) : false) ||
    (nameLower ? lower.includes(nameLower) : false)
  );
}

/**
 * Find the matching Classroom / Laboratory for a location label, prioritizing exact matches
 * and longest room names first so "Room 102B" beats "Room 102".
 */
export function findMatchingRoom(
  locationText: string | undefined | null,
  locations: MockLocation[]
): MockLocation | undefined {
  if (!locationText) return undefined;
  const trimmed = locationText.trim();
  if (!trimmed || trimmed.toLowerCase() === 'unassigned') return undefined;

  const lower = trimmed.toLowerCase();
  const exact = locations.find((loc) => {
    const roomLower = (loc.room || '').trim().toLowerCase();
    const nameLower = (loc.name || '').trim().toLowerCase();
    const codeLower = (loc.code || '').trim().toLowerCase();
    return (
      (codeLower && lower === codeLower) ||
      (roomLower && lower === roomLower) ||
      (nameLower && lower === nameLower) ||
      (nameLower && roomLower && lower === `${nameLower} (${roomLower})`)
    );
  });
  if (exact) return exact;

  const bySpecificity = [...locations].sort(
    (a, b) => (b.room || '').length - (a.room || '').length
  );
  return bySpecificity.find((loc) => doesLocationMatchRoom(trimmed, loc));
}

/**
 * Resolve the backing Central Inventory (/stock) record for an allocated room_inventory entry.
 * Only explicit stockItemId / SKU links are accepted so unlinked or deleted items never linger.
 */
export function findLinkedStockItem(
  inv: RoomInventoryItem,
  stock: MockItem[]
): MockItem | undefined {
  if (!inv.stockItemId) return undefined;
  const target = inv.stockItemId.trim().toLowerCase();
  return stock.find(
    (s) => s.id.toLowerCase() === target || s.code.toLowerCase() === target
  );
}

export interface RoomFleetStats {
  matchingStock: MockItem[];
  linkedExtraInvs: RoomInventoryItem[];
  matchingAssets: MockAsset[];
  stockItemsCount: number;
  totalStockUnits: number;
  hardwareAssetsCount: number;
  totalHardwareUnits: number;
  totalBrokenCount: number;
  totalMaintenanceCount: number;
  lowStockCount: number;
  totalWorkingUnits: number;
  totalAllUnits: number;
  healthRate: number;
  healthStatus: 'good' | 'warning' | 'critical';
}

/**
 * Single source of truth computing room-level Inventory (/stock + valid allocations)
 * and Hardware Assets (/assets) counts & health metrics.
 */
export function getRoomInventoryStats(
  loc: MockLocation,
  stock: MockItem[],
  assets: MockAsset[]
): RoomFleetStats {
  const matchingStock = stock.filter((s) => doesLocationMatchRoom(s.location, loc));
  const matchingStockIds = new Set(matchingStock.map((s) => s.id));

  // Include explicit stock allocations assigned to this room unless already directly stationed here
  const linkedExtraInvs = (loc.inventories || []).filter((inv) => {
    const linked = findLinkedStockItem(inv, stock);
    return Boolean(linked) && !matchingStockIds.has(linked!.id);
  });

  const directStockUnits = matchingStock.reduce((sum, s) => sum + (s.quantity || 0), 0);
  const allocWorkingUnits = linkedExtraInvs.reduce((sum, inv) => sum + (inv.qtyWorking || 0), 0);
  const allocBrokenUnits = linkedExtraInvs.reduce((sum, inv) => sum + (inv.qtyBroken || 0), 0);
  const allocMaintUnits = linkedExtraInvs.reduce((sum, inv) => sum + (inv.qtyMaintenance || 0), 0);
  const allocTotalUnits = allocWorkingUnits + allocBrokenUnits + allocMaintUnits;

  const stockItemsCount = matchingStock.length + linkedExtraInvs.length;
  const totalStockUnits = directStockUnits + allocTotalUnits;

  const matchingAssets = assets.filter((a) => doesLocationMatchRoom(a.location, loc));
  const hardwareAssetsCount = matchingAssets.length;
  const totalHardwareUnits = matchingAssets.reduce((sum, a) => sum + (a.totalUnits ?? 1), 0);

  const maintenanceHardwareUnits = matchingAssets
    .filter((a) => a.status === 'maintenance')
    .reduce((sum, a) => sum + (a.totalUnits ?? 1), 0);

  const workingHardwareUnits = matchingAssets
    .filter((a) => a.status !== 'maintenance')
    .reduce((sum, a) => sum + (a.totalUnits ?? 1), 0);

  const lowStockCount = matchingStock.filter((s) => s.status !== 'in_stock').length;
  const outOfStockUnits = matchingStock
    .filter((s) => s.status === 'out_of_stock')
    .reduce((sum, s) => sum + (s.quantity || 0), 0);

  const totalBrokenCount = allocBrokenUnits;
  const totalMaintenanceCount = allocMaintUnits + maintenanceHardwareUnits;
  const totalAllUnits = totalStockUnits + totalHardwareUnits;
  const totalWorkingUnits =
    Math.max(0, directStockUnits - outOfStockUnits) + allocWorkingUnits + workingHardwareUnits;

  const healthRate =
    totalAllUnits > 0
      ? Math.max(0, Math.round((totalWorkingUnits / totalAllUnits) * 100))
      : 100;

  let healthStatus: 'good' | 'warning' | 'critical' = 'good';
  if (totalBrokenCount >= 4 || (totalAllUnits > 0 && healthRate < 75)) {
    healthStatus = 'critical';
  } else if (totalBrokenCount > 0 || totalMaintenanceCount > 0 || lowStockCount > 0) {
    healthStatus = 'warning';
  }

  return {
    matchingStock,
    linkedExtraInvs,
    matchingAssets,
    stockItemsCount,
    totalStockUnits,
    hardwareAssetsCount,
    totalHardwareUnits,
    totalBrokenCount,
    totalMaintenanceCount,
    lowStockCount,
    totalWorkingUnits,
    totalAllUnits,
    healthRate,
    healthStatus,
  };
}

