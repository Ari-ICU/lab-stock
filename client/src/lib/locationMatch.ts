import { AssetGroup, MockAsset, MockItem, MockLocation, RoomInventoryItem } from '@/types';

/** Infer classroom equipment category group from central inventory category & item name. */
export function inferAssetGroup(category: string, name: string): AssetGroup {
  const text = `${category} ${name}`.toLowerCase();
  if (/(chair|table|desk|cabinet|fixture|bench|whiteboard|seating|locker|furniture|podium)/.test(text)) {
    return 'FURNITURE';
  }
  if (/(electrical|hvac|light|socket|power|cable|cord|surge|battery|ups|adapter|fan|air\s*cond|climate|cooling|ventilat)/.test(text)) {
    return 'ELECTRICAL';
  }
  if (/(safety|fire|extinguisher|misc|first aid|stationery|toner|ink|paper|tool)/.test(text)) {
    return 'SAFETY_MISC';
  }
  return 'IT_HARDWARE';
}

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

export interface ConsolidatedRoomInventoryItem extends RoomInventoryItem {
  sourceIds: string[];
}

/** Combine non-empty room remarks while removing exact duplicate segments. */
export function buildRoomLabel(loc: Pick<MockLocation, 'name' | 'room'>): string {
  return `${loc.name} (${loc.room})`;
}

/** Validate optional returnTo path so room redirects stay strictly on internal /locations/* routes. */
export function getSafeLocationReturnPath(
  rawReturnTo: string | null | undefined,
  fallback: string
): string {
  if (!rawReturnTo) return fallback;
  const trimmed = rawReturnTo.trim();
  if (trimmed.startsWith('/locations/') && !trimmed.startsWith('//')) {
    return trimmed;
  }
  return fallback;
}

/** Collect distinct shelf / cabinet / bin labels used in stock, prioritizing the selected room. */
export function collectShelfSuggestions(
  stock: MockItem[],
  selectedLocation?: string
): string[] {
  const seen = new Set<string>();
  const ordered: string[] = [];
  const target = (selectedLocation || '').trim().toLowerCase();

  const pushUnique = (raw?: string) => {
    const clean = (raw || '').trim();
    if (!clean) return;
    const key = clean.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    ordered.push(clean);
  };

  if (target) {
    stock
      .filter((item) => (item.location || '').trim().toLowerCase() === target)
      .forEach((item) => pushUnique(item.rack));
  }
  stock.forEach((item) => pushUnique(item.rack));
  return ordered.slice(0, 20);
}

/** Combine non-empty room remarks while removing exact duplicate segments. */
export function mergeDistinctRemarks(...values: Array<string | undefined | null>): string | undefined {
  const seen = new Set<string>();
  const parts: string[] = [];

  for (const raw of values) {
    if (!raw || typeof raw !== 'string') continue;
    for (const piece of raw.split(' · ')) {
      const trimmed = piece.trim();
      if (!trimmed) continue;
      const normalized = trimmed.toLowerCase();
      if (!seen.has(normalized)) {
        seen.add(normalized);
        parts.push(trimmed);
      }
    }
  }

  return parts.length > 0 ? parts.join(' · ') : undefined;
}

/** Stable identity key for grouping repeated allocations of the same item in one classroom. */
export function getRoomInventoryItemKey(
  inv: Pick<RoomInventoryItem, 'stockItemId' | 'assetId' | 'name' | 'unit'>,
  stock: MockItem[]
): string {
  const linked = inv.stockItemId
    ? findLinkedStockItem(inv as RoomInventoryItem, stock)
    : undefined;
  if (linked) return `stock:${linked.id.toLowerCase()}`;
  if (inv.stockItemId) return `stock:${inv.stockItemId.trim().toLowerCase()}`;
  if (inv.assetId) return `asset:${inv.assetId.trim().toLowerCase()}`;
  return `name:${inv.name.trim().toLowerCase()}|unit:${(inv.unit || 'pcs').trim().toLowerCase()}`;
}

/** Consolidate duplicate room inventory records for the same SKU/item into a single display row. */
export function consolidateRoomInventories(
  inventories: RoomInventoryItem[],
  stock: MockItem[]
): ConsolidatedRoomInventoryItem[] {
  const order: string[] = [];
  const grouped = new Map<string, ConsolidatedRoomInventoryItem>();

  for (const inv of inventories) {
    const key = getRoomInventoryItemKey(inv, stock);
    const existing = grouped.get(key);

    if (!existing) {
      order.push(key);
      grouped.set(key, {
        ...inv,
        qtyWorking: inv.qtyWorking || 0,
        qtyBroken: inv.qtyBroken || 0,
        qtyMaintenance: inv.qtyMaintenance || 0,
        sourceIds: [inv.id],
      });
      continue;
    }

    existing.qtyWorking += inv.qtyWorking || 0;
    existing.qtyBroken += inv.qtyBroken || 0;
    existing.qtyMaintenance += inv.qtyMaintenance || 0;
    existing.remarks = mergeDistinctRemarks(existing.remarks, inv.remarks);
    if (inv.lastAuditedAt) {
      existing.lastAuditedAt = inv.lastAuditedAt;
    }
    if (!existing.sourceIds.includes(inv.id)) {
      existing.sourceIds.push(inv.id);
    }
  }

  return order.map((k) => grouped.get(k)!);
}

/** Find a consolidated room inventory entry matching either its primary ID or any merged sibling ID. */
export function findConsolidatedRoomItem(
  loc: MockLocation | undefined,
  itemId: string,
  stock: MockItem[]
): ConsolidatedRoomInventoryItem | undefined {
  if (!loc || !itemId) return undefined;
  const consolidated = consolidateRoomInventories(loc.inventories || [], stock);
  return consolidated.find((c) => c.id === itemId || c.sourceIds.includes(itemId));
}

export interface RoomFleetStats {
  matchingStock: MockItem[];
  linkedExtraInvs: ConsolidatedRoomInventoryItem[];
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
 * Single source of truth computing room-level Inventory (/stock + valid consolidated allocations)
 * and Hardware Assets (/assets) counts & health metrics.
 */
export function getRoomInventoryStats(
  loc: MockLocation,
  stock: MockItem[],
  assets: MockAsset[]
): RoomFleetStats {
  const matchingStock = stock.filter((s) => doesLocationMatchRoom(s.location, loc));
  const matchingStockIds = new Set(matchingStock.map((s) => s.id));

  // Include explicit stock allocations assigned to this room unless already directly stationed here,
  // merging repeated allocations of the same item into a single entry.
  const rawLinkedExtraInvs = (loc.inventories || []).filter((inv) => {
    const linked = findLinkedStockItem(inv, stock);
    return Boolean(linked) && !matchingStockIds.has(linked!.id);
  });
  const linkedExtraInvs = consolidateRoomInventories(rawLinkedExtraInvs, stock);

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

