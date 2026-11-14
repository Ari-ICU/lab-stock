import { DropdownOption } from '@/types';
import { MockItem } from '@/types/stock';

export const DEFAULT_STOCK_CATEGORIES: DropdownOption[] = [];

/**
 * Merges real categories from PostgreSQL and inventory stock, deduplicated case-insensitively and sorted.
 */
export function buildStockCategoryOptions(
  stock: MockItem[],
  dbCategories: string[] = []
): DropdownOption[] {
  const map = new Map<string, DropdownOption>();

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

  return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
}
