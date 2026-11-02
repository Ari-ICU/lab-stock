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

