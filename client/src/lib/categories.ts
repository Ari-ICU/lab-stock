import { DropdownOption } from '@/types';
import { MockItem } from '@/types/stock';

export const DEFAULT_STOCK_CATEGORIES: DropdownOption[] = [
  { label: 'Office Stationery & Paper', value: 'Office Stationery' },
  { label: 'Printer Ink & Toner Cartridges', value: 'Printer Ink & Toner' },
  { label: 'Hardware Tools & Equipment', value: 'Tools & Equipment' },
  { label: 'Monitors & Displays', value: 'Monitors' },
  { label: 'Mice, Keyboards & Peripherals', value: 'Mice & Keyboards' },
  { label: 'Cables & Accessories', value: 'Cables & Accessories' },
  { label: 'Power & Climate Spares', value: 'Power & Climate' },
  { label: 'Network Spares & Transceivers', value: 'Network Spares' },
  { label: 'Networking Equipment', value: 'Networking Equipment' },
  { label: 'Electronics & Tools', value: 'Electronics & Tools' },
];

/**
 * Merges default starter categories with categories stored in PostgreSQL and inventory stock.
 */
export function buildStockCategoryOptions(
  stock: MockItem[],
  dbCategories: string[] = []
): DropdownOption[] {
  const map = new Map<string, DropdownOption>();

  for (const opt of DEFAULT_STOCK_CATEGORIES) {
    map.set(opt.value.toLowerCase(), opt);
  }

  for (const cat of dbCategories) {
    const raw = cat?.trim();
    if (!raw) continue;
    const key = raw.toLowerCase();
    if (!map.has(key)) {
      map.set(key, { label: raw, value: raw });
    }
  }

  for (const item of stock) {
    const raw = item.category?.trim();
    if (!raw) continue;
    const key = raw.toLowerCase();
    if (!map.has(key)) {
      map.set(key, { label: raw, value: raw });
    }
  }

  return Array.from(map.values());
}
