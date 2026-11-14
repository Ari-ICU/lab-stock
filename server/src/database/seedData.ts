export const seedLocations: Array<{
  code: string;
  name: string;
  building: string;
  room: string;
  room_type: string;
  last_audited_at?: string;
  audited_by?: string;
}> = [];

export const seedAssets: Array<{
  serial_number: string;
  name: string;
  model: string;
  total_units: number;
  unit_type: string;
  room?: string;
  placement_rack?: string;
  status: string;
  loan_status: string;
  image_url?: string;
  description?: string;
}> = [];

export const seedStock: Array<{
  code: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  room?: string;
  rack?: string;
  status: string;
  image_url?: string;
  description?: string;
}> = [];

export const seedLoans: Array<{
  serial_number: string;
  borrower_name: string;
  borrower_role: string;
  borrower_contact?: string;
  course_or_class?: string;
  borrow_date: string;
  expected_return_date: string;
  actual_return_date?: string;
  status: string;
  notes?: string;
}> = [];

export const seedTransfers: Array<{
  serial_number: string;
  from_room: string;
  to_room: string;
  transfer_date: string;
  transferred_by: string;
  reason?: string;
}> = [];

export const seedMaintenance: Array<{
  serial_number: string;
  asset_name: string;
  type: string;
  date: string;
  technician: string;
  status: string;
  image_url?: string;
  location?: string;
  cost?: number;
  quantity?: number;
  unit?: string;
  notes?: string;
}> = [];

export const seedPurchaseRequests: Array<{
  id: string;
  title: string;
  category: string;
  target_room: string;
  quantity: number;
  unit: string;
  estimated_cost?: string;
  priority: string;
  status: string;
  reason: string;
  requested_by: string;
  requester_role: string;
  request_date: string;
  image_url?: string;
  notes?: string;
}> = [];

export const seedRoomInventory: Array<{
  room_code: string;
  name: string;
  group_type: string;
  brand_spec?: string;
  unit?: string;
  qty_working?: number;
  qty_broken?: number;
  qty_maintenance?: number;
  remarks?: string;
}> = [];

/**
 * Mock data seeding is disabled so the database stays clean until real records are created.
 */
export async function seedAllData(): Promise<void> {
  console.log('ℹ️ No mock seed data configured; keeping database clean.');
}
