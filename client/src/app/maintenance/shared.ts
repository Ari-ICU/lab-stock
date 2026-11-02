import { MockMaintenance } from '@/types';

export const MAINTENANCE_TYPES = [
  'Firmware Upgrade',
  'Port Audit',
  'Hardware RMA',
  'Power Supply Replacement',
  'Routine Inspection',
  'Preventive Maintenance',
  'Calibration & Tuning',
  'OS & Software Re-image',
  'Part Replacement / Repair',
  'Safety & Compliance Check',
];

export const MAINTENANCE_STATUS_OPTIONS = [
  { label: 'Completed (Verified & Signed Off)', value: 'Completed' },
  { label: 'In Progress (Active Servicing / Diagnostics)', value: 'In Progress' },
  { label: 'Pending (Scheduled / Awaiting Parts)', value: 'Pending' },
];

export const DEFAULT_MAINTENANCE_PRESETS = [
  {
    name: 'Hardware Diagnostics & Board Repair',
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Server Rack & Switch Maintenance',
    imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Workstation Re-imaging & OS Setup',
    imageUrl: 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Electrical & Power Infrastructure',
    imageUrl: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'HVAC & Climate Control Servicing',
    imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80',
  },
];

/**
 * Intelligent helper that resolves the best visual image for any maintenance record.
 * Checks explicit image -> exact asset/stock match -> fuzzy matching -> contextual equipment keywords.
 */
export function resolveMaintenanceImage(
  item: Partial<MockMaintenance>,
  assets: Array<{ name: string; serialNumber: string; imageUrl?: string }> = [],
  stock: Array<{ name: string; code: string; imageUrl?: string }> = []
): string {
  // 1. Explicit image URL
  if (item.imageUrl && item.imageUrl.trim().length > 0) {
    return item.imageUrl.trim();
  }

  const sn = (item.serialNumber || '').trim().toLowerCase();
  const name = (item.assetName || '').trim().toLowerCase();

  // 2. Exact match in registered assets
  if (sn || name) {
    const assetExact = assets.find(
      (a) =>
        (sn && a.serialNumber.toLowerCase() === sn) ||
        (name && a.name.toLowerCase() === name)
    );
    if (assetExact?.imageUrl) return assetExact.imageUrl;

    // 3. Exact match in stock
    const stockExact = stock.find(
      (s) =>
        (sn && s.code.toLowerCase() === sn) ||
        (name && s.name.toLowerCase() === name)
    );
    if (stockExact?.imageUrl) return stockExact.imageUrl;

    // 4. Fuzzy match in assets
    const assetFuzzy = assets.find(
      (a) =>
        (sn && a.serialNumber.toLowerCase().includes(sn)) ||
        (sn && sn.includes(a.serialNumber.toLowerCase())) ||
        (name && a.name.toLowerCase().includes(name)) ||
        (name && name.includes(a.name.toLowerCase()))
    );
    if (assetFuzzy?.imageUrl) return assetFuzzy.imageUrl;

    // 5. Fuzzy match in stock
    const stockFuzzy = stock.find(
      (s) =>
        (sn && s.code.toLowerCase().includes(sn)) ||
        (sn && sn.includes(s.code.toLowerCase())) ||
        (name && s.name.toLowerCase().includes(name)) ||
        (name && name.includes(s.name.toLowerCase()))
    );
    if (stockFuzzy?.imageUrl) return stockFuzzy.imageUrl;
  }

  // 6. Smart keyword match
  const text = `${name} ${sn}`.toLowerCase();
  if (
    text.includes('switch') ||
    text.includes('cisco') ||
    text.includes('router') ||
    text.includes('catalyst') ||
    text.includes('network') ||
    text.includes('fcw') ||
    text.includes('fcm')
  ) {
    return 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=600&q=80';
  }

  if (
    text.includes('air') ||
    text.includes('daikin') ||
    text.includes('conditioner') ||
    text.includes('hvac') ||
    text.includes('dkn')
  ) {
    return 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80';
  }

  if (
    text.includes('projector') ||
    text.includes('epson') ||
    text.includes('screen') ||
    text.includes('display') ||
    text.includes('eps')
  ) {
    return 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=600&q=80';
  }

  if (
    text.includes('desktop') ||
    text.includes('optiplex') ||
    text.includes('dell') ||
    text.includes('pc') ||
    text.includes('workstation') ||
    text.includes('opt-')
  ) {
    return 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80';
  }

  if (
    text.includes('server') ||
    text.includes('rack') ||
    text.includes('datacenter')
  ) {
    return 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80';
  }

  // 7. General clean lab diagnostic photo fallback
  return 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80';
}


