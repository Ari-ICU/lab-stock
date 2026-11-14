import { AssetGroup, MockLocation, MockItem, MockAsset, RoomInventoryItem } from '@/types';
import { findLinkedStockItem } from '@/lib/locationMatch';

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
  { label: 'Operational', value: 'operational' },
  { label: 'Broken', value: 'defective' },
  { label: 'In Repair', value: 'maintenance' },
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
  return findLinkedStockItem(item, stock);
}

export function findLinkedAsset(item: RoomInventoryItem, assets: MockAsset[]) {
  if (!item.assetId) return undefined;
  const target = item.assetId.trim().toLowerCase();
  return assets.find(
    (a) => a.id.toLowerCase() === target || a.serialNumber.toLowerCase() === target
  );
}

/**
 * Robust image resolver for classroom & laboratory equipment items.
 * Prioritizes direct item images, linked stock, linked assets (via ID or name matching),
 * and intelligent semantic keyword fallbacks so equipment never shows broken/empty placeholders.
 */
export function getRoomItemImage(
  item: RoomInventoryItem,
  stock: MockItem[] = [],
  assets: MockAsset[] = []
): string {
  const directImageUrl = (item as RoomInventoryItem & { imageUrl?: string }).imageUrl;
  if (directImageUrl) return directImageUrl;

  const linkedStock = findLinkedStock(item, stock);
  if (linkedStock?.imageUrl) return linkedStock.imageUrl;

  const linkedAsset = findLinkedAsset(item, assets);
  if (linkedAsset?.imageUrl) return linkedAsset.imageUrl;

  const text = `${item.name || ''} ${item.brandSpec || ''} ${item.group || ''}`.toLowerCase();

  // Projectors & Screens
  if (text.includes('projector') || text.includes('screen') || text.includes('epson') || text.includes('benq') || text.includes('dlp')) {
    return 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=600&q=80';
  }

  // Chairs & Seating
  if (text.includes('chair') || text.includes('seat') || text.includes('swivel') || text.includes('stool')) {
    return 'https://images.unsplash.com/photo-1592078615290-033ee584e267?auto=format&fit=crop&w=600&q=80';
  }

  // Server Racks & Enclosures
  if (text.includes('server rack') || text.includes('42u') || text.includes('enclosure')) {
    return 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80';
  }

  // Cabinets, Lockers & Storage Shelving
  if (text.includes('cabinet') || text.includes('locker') || text.includes('storage rack') || text.includes('shelf')) {
    return 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=600&q=80';
  }

  // Desks & Tables
  if (text.includes('desk') || text.includes('table') || text.includes('bench') || text.includes('workstation')) {
    return 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=600&q=80';
  }

  // Air Conditioners, Fans & HVAC
  if (text.includes('air') || text.includes('conditioner') || text.includes('fan') || /\bac\b/.test(text) || text.includes('daikin') || text.includes('panasonic') || text.includes('hvac')) {
    return 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80';
  }

  // Lighting & Electrical Tubes
  if (text.includes('light') || text.includes('lamp') || text.includes('tube') || text.includes('led') || text.includes('philips')) {
    return 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=600&q=80';
  }

  // Desktop PCs & Computer Units
  if (text.includes('pc') || text.includes('computer') || text.includes('desktop') || text.includes('optiplex') || text.includes('dell') || text.includes('thinkcentre') || text.includes('lenovo')) {
    return 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80';
  }

  // Whiteboards & Teaching Tools
  if (text.includes('whiteboard') || text.includes('board') || text.includes('marker')) {
    return 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=600&q=80';
  }

  // Wall Sockets & Power Strips
  if (text.includes('socket') || text.includes('power') || text.includes('strip') || text.includes('plug') || text.includes('schneider')) {
    return 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80';
  }

  // Fire Extinguishers & Safety
  if (text.includes('fire') || text.includes('extinguisher') || text.includes('safety') || text.includes('co2')) {
    return 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=600&q=80';
  }

  // Network Switches, Routers & Cables
  if (text.includes('switch') || text.includes('router') || text.includes('cisco') || text.includes('cable') || text.includes('ethernet')) {
    return 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=600&q=80';
  }

  // Category fallback
  switch (item.group) {
    case 'IT_HARDWARE':
      return 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80';
    case 'FURNITURE':
      return 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=600&q=80';
    case 'ELECTRICAL':
      return 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80';
    case 'SAFETY_MISC':
      return 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=600&q=80';
    default:
      return 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80';
  }
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

