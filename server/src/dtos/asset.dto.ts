export interface CreateAssetDto {
  serial_number?: string;
  serialNumber?: string;
  serial?: string;
  name: string;
  model: string;
  total_units?: number;
  totalUnits?: number;
  unit_type?: string;
  unitType?: string;
  location_id?: string;
  locationId?: string;
  placement_rack?: string;
  placementRack?: string;
  rack?: string;
  location?: string;
  status?: 'operational' | 'in_use' | 'maintenance';
  loan_status?: 'available' | 'on_loan';
  loanStatus?: 'available' | 'on_loan';
  current_borrower?: string;
  currentBorrower?: string;
  loan_due_date?: string;
  loanDueDate?: string;
  next_calibration?: string;
  nextCalibration?: string;
  image_url?: string;
  imageUrl?: string;
  description?: string;
}

export interface UpdateAssetDto {
  name?: string;
  model?: string;
  total_units?: number;
  totalUnits?: number;
  unit_type?: string;
  unitType?: string;
  location_id?: string;
  locationId?: string;
  placement_rack?: string;
  placementRack?: string;
  rack?: string;
  location?: string;
  status?: 'operational' | 'in_use' | 'maintenance';
  loan_status?: 'available' | 'on_loan';
  loanStatus?: 'available' | 'on_loan';
  current_borrower?: string;
  currentBorrower?: string;
  loan_due_date?: string;
  loanDueDate?: string;
  next_calibration?: string;
  nextCalibration?: string;
  image_url?: string;
  imageUrl?: string;
  description?: string;
}

export interface AssetFilterQueryDto {
  status?: string;
  search?: string;
}

