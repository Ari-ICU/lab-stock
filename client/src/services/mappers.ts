import { MockAsset, MockItem, MockLocation, MockLoan, MockTransfer } from '@/types';

/**
 * Data mappers to convert between PostgreSQL / Express API payloads (snake_case)
 * and Frontend state interfaces (camelCase).
 */

export function mapServerAsset(a: any): MockAsset {
  const locStr = a.location_room
    ? `${a.location_name || a.location || 'Lab'} (${a.location_room})`
    : a.location_name || a.location || 'Unassigned';

  return {
    id: String(a.id),
    serverId: String(a.id),
    name: a.name || 'Hardware Device',
    model: a.model || 'Standard',
    serialNumber: a.serial_number || a.serialNumber || 'SN-N/A',
    totalUnits: Number(a.total_units ?? a.totalUnits ?? 1),
    unitType: a.unit_type || a.unitType || 'Units',
    location: locStr,
    status: (a.status as MockAsset['status']) || 'operational',
    loanStatus: (a.loan_status as MockAsset['loanStatus']) || 'available',
    currentBorrower: a.current_borrower || a.currentBorrower,
    loanDueDate: a.loan_due_date || a.loanDueDate,
    nextCalibration: a.next_calibration || a.nextCalibration || 'Active',
    imageUrl: a.image_url || a.imageUrl,
    description: a.description || '',
  };
}

export function toServerAsset(a: Partial<MockAsset>): Record<string, any> {
  return {
    name: a.name,
    model: a.model,
    serial_number: a.serialNumber,
    total_units: a.totalUnits,
    unit_type: a.unitType,
    location: a.location,
    status: a.status,
    loan_status: a.loanStatus,
    current_borrower: a.currentBorrower,
    loan_due_date: a.loanDueDate && a.loanDueDate.trim() ? a.loanDueDate.trim() : null,
    next_calibration: a.nextCalibration,
    image_url: a.imageUrl,
    description: a.description,
  };
}

export function mapServerStock(s: any): MockItem {
  const locStr = s.location_room
    ? `${s.location_name || s.location || 'Lab'} (${s.location_room})`
    : s.location_name || s.location || 'Unassigned';

  return {
    id: String(s.id),
    serverId: String(s.id),
    name: s.name || 'Consumable Item',
    code: s.code || 'SKU-000',
    category: s.category || 'Peripherals',
    quantity: Number(s.quantity ?? 1),
    unit: s.unit || 'Units',
    location: locStr,
    rack: s.rack || 'Shelf 01',
    status: (s.status as MockItem['status']) || (Number(s.quantity) > 5 ? 'in_stock' : 'low_stock'),
    expiryDate: s.expiry_date || s.expiryDate || 'Active',
    imageUrl: s.image_url || s.imageUrl,
    description: s.description || '',
  };
}

export function toServerStock(s: Partial<MockItem>): Record<string, any> {
  return {
    name: s.name,
    code: s.code,
    category: s.category,
    quantity: s.quantity,
    unit: s.unit,
    location: s.location,
    rack: s.rack,
    status: s.status,
    expiry_date: s.expiryDate,
    image_url: s.imageUrl,
    description: s.description,
  };
}

export function mapServerLocation(l: any): MockLocation {
  const inventories = Array.isArray(l.inventories)
    ? l.inventories.map((ri: any) => ({
        id: String(ri.id),
        roomId: String(ri.roomId || ri.room_id || l.id),
        stockItemId: ri.stockItemId || ri.stock_item_id ? String(ri.stockItemId || ri.stock_item_id) : undefined,
        assetId: ri.assetId || ri.asset_id ? String(ri.assetId || ri.asset_id) : undefined,
        name: ri.name || 'Room Item',
        group: ri.group || ri.group_type || 'FURNITURE',
        brandSpec: ri.brandSpec || ri.brand_spec || '',
        unit: ri.unit || 'pcs',
        qtyWorking: Number(ri.qtyWorking ?? ri.qty_working ?? 0),
        qtyBroken: Number(ri.qtyBroken ?? ri.qty_broken ?? 0),
        qtyMaintenance: Number(ri.qtyMaintenance ?? ri.qty_maintenance ?? 0),
        remarks: ri.remarks || '',
        lastAuditedAt: ri.lastAuditedAt || ri.last_audited_at,
      }))
    : [];

  return {
    id: String(l.id),
    serverId: String(l.id),
    code: l.code || '',
    name: l.name || 'Laboratory Room',
    room: l.room || 'Room 101',
    building: l.building || 'Engineering Block A',
    floor: Number(l.floor ?? 1),
    capacity: Number(l.capacity ?? 30),
    type: l.room_type || l.type || 'COMPUTER_LAB',
    totalAssets: Number(l.total_assets ?? l.totalAssets ?? 0),
    totalItems: Number(l.total_items ?? l.totalItems ?? 0),
    inventories,
    lastAuditedAt: l.last_audited_at || l.lastAuditedAt,
    auditedBy: l.audited_by || l.auditedBy,
  };
}

function buildLocationCode(room?: string, explicitCode?: string): string | undefined {
  if (explicitCode && explicitCode.trim().length >= 2) {
    return explicitCode.trim().toUpperCase();
  }
  if (!room || !room.trim()) return undefined;
  const cleaned = room
    .trim()
    .replace(/^(room|rm|lab)\s*/i, '')
    .replace(/[^a-zA-Z0-9]+/g, '')
    .toUpperCase();
  if (cleaned.length >= 2) {
    return cleaned.startsWith('L') ? cleaned : `L${cleaned}`;
  }
  const fallback = room.trim().replace(/[^a-zA-Z0-9]+/g, '').toUpperCase();
  return fallback.length >= 2 ? fallback : `LOC${fallback || 'ROOM'}`;
}

export function toServerLocation(l: Partial<MockLocation>): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    name: l.name,
    room: l.room,
    building: l.building,
  };

  const code = buildLocationCode(l.room, l.code);
  if (code) payload.code = code;

  if (l.capacity !== undefined && Number.isInteger(Number(l.capacity)) && Number(l.capacity) >= 1) {
    payload.capacity = Number(l.capacity);
  }
  if (l.floor !== undefined && Number.isInteger(Number(l.floor))) {
    payload.floor = Number(l.floor);
  }
  if (l.type !== undefined) {
    payload.room_type = l.type;
  }

  return payload;
}

export function mapServerLoan(l: any): MockLoan {
  return {
    id: String(l.id),
    serverId: String(l.id),
    assetId: l.asset_id || l.assetId ? String(l.asset_id || l.assetId) : undefined,
    stockId: l.stock_id || l.stockId ? String(l.stock_id || l.stockId) : undefined,
    itemType: (l.item_type || l.itemType || (l.stock_id || l.stockId ? 'stock' : 'asset')) as MockLoan['itemType'],
    quantity: l.quantity ? Number(l.quantity) : 1,
    assetName: l.asset_name || l.assetName || 'Lab Device',
    serialNumber: l.serial_number || l.serialNumber || 'SN-N/A',
    borrowerName: l.borrower_name || l.borrowerName || 'Borrower',
    borrowerRole: (l.borrower_role || l.borrowerRole || 'Student') as MockLoan['borrowerRole'],
    borrowerContact: l.borrower_contact || l.borrowerContact || '',
    courseOrClass: l.course_or_class || l.courseOrClass || '',
    borrowDate: l.borrow_date || l.borrowDate || new Date().toISOString().split('T')[0],
    expectedReturnDate: l.expected_return_date || l.expectedReturnDate || '',
    actualReturnDate: l.actual_return_date || l.actualReturnDate,
    status: (l.status as MockLoan['status']) || 'active',
    notes: l.notes || '',
  };
}

export function toServerLoan(l: Partial<MockLoan>): Record<string, any> {
  return {
    asset_id: l.assetId,
    stock_id: l.stockId,
    item_type: l.itemType,
    quantity: l.quantity,
    borrower_name: l.borrowerName,
    borrower_role: l.borrowerRole,
    borrower_contact: l.borrowerContact,
    course_or_class: l.courseOrClass,
    borrow_date: l.borrowDate,
    expected_return_date: l.expectedReturnDate,
    actual_return_date: l.actualReturnDate,
    status: l.status,
    notes: l.notes,
  };
}

export function mapServerTransfer(t: any): MockTransfer {
  return {
    id: String(t.id),
    assetId: String(t.asset_id || t.assetId),
    assetName: t.asset_name || t.assetName || 'Lab Asset',
    serialNumber: t.serial_number || t.serialNumber || 'N/A',
    fromLocation: t.from_location || t.fromLocation || 'Central Depository',
    toLocation: t.to_location || t.toLocation || 'Laboratory Facility',
    transferDate: t.transfer_date ? (typeof t.transfer_date === 'string' ? t.transfer_date.split('T')[0] : new Date(t.transfer_date).toISOString().split('T')[0]) : new Date().toISOString().split('T')[0],
    transferredBy: t.transferred_by || t.transferredBy || 'Faculty Administrator',
    reason: t.reason || '',
  };
}




