import { MockAsset, MockItem, MockLocation, MockLoan, MockMaintenance } from '@/types';

/**
 * Data mappers to convert between PostgreSQL / Express API payloads (snake_case)
 * and Frontend state interfaces (camelCase).
 */

export function mapServerAsset(a: any): MockAsset {
  const locStr = a.location_room
    ? `${a.location_name || a.location || 'Lab'} (${a.location_room})`
    : a.location_name || a.location || 'Computer Lab Room 102B';

  return {
    id: String(a.id),
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
    : s.location_name || s.location || 'Computer Lab Room 102B';

  return {
    id: String(s.id),
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
  return {
    id: String(l.id),
    name: l.name || 'Laboratory Room',
    room: l.room || 'Room 101',
    building: l.building || 'Engineering Block A',
    totalAssets: Number(l.total_assets ?? l.totalAssets ?? 0),
    totalItems: Number(l.total_items ?? l.totalItems ?? 0),
    imageUrl: l.image_url || l.imageUrl,
  };
}

export function toServerLocation(l: Partial<MockLocation>): Record<string, any> {
  return {
    name: l.name,
    room: l.room,
    building: l.building,
    image_url: l.imageUrl,
  };
}

export function mapServerLoan(l: any): MockLoan {
  return {
    id: String(l.id),
    assetId: String(l.asset_id || l.assetId || ''),
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

export function mapServerMaintenance(m: any): MockMaintenance {
  return {
    id: String(m.id),
    assetName: m.asset_name || m.assetName || 'Hardware Instrument',
    serialNumber: m.serial_number || m.serialNumber || 'SN-N/A',
    type: (m.type as MockMaintenance['type']) || 'Firmware Upgrade',
    date: m.date ? (typeof m.date === 'string' ? m.date.split('T')[0] : new Date(m.date).toISOString().split('T')[0]) : new Date().toISOString().split('T')[0],
    technician: m.technician || 'Technician',
    status: (m.status as MockMaintenance['status']) || 'Pending',
    notes: m.notes || '',
  };
}

export function toServerMaintenance(m: Partial<MockMaintenance>): Record<string, any> {
  return {
    asset_name: m.assetName,
    serial_number: m.serialNumber,
    type: m.type,
    date: m.date,
    technician: m.technician,
    status: m.status,
    notes: m.notes,
  };
}


