import { Request, Response, NextFunction } from 'express';
import { ValidationException } from '../exceptions/errorHandler.js';
import { validatePasswordStrength } from '../utils/password.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// ========================================================
// AUTHENTICATION VALIDATORS
// ========================================================

/**
 * Validate user login payload
 */
export function validateLogin(req: Request, _res: Response, next: NextFunction) {
  const { email, password } = req.body;
  const errors: Record<string, string> = {};

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    errors.email = 'A valid email address is required';
  }

  if (!password || typeof password !== 'string' || password.trim().length === 0) {
    errors.password = 'Password is required';
  }

  if (Object.keys(errors).length > 0) {
    return next(new ValidationException('Invalid login credentials payload', errors));
  }

  req.body.email = email.trim().toLowerCase();
  next();
}

/**
 * Validate new user registration payload
 */
export function validateRegister(req: Request, _res: Response, next: NextFunction) {
  const { name, email, password, role, department } = req.body;
  const errors: Record<string, string> = {};

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.name = 'Full name must be at least 2 characters';
  }

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    errors.email = 'A valid institutional email address is required';
  }

  const passwordCheck = validatePasswordStrength(password);
  if (!passwordCheck.valid) {
    errors.password = passwordCheck.error || 'Password does not meet security requirements';
  }

  if (role && typeof role !== 'string') {
    errors.role = 'Role must be a valid string identifier';
  }

  if (department && typeof department !== 'string') {
    errors.department = 'Department must be a string identifier';
  }

  if (Object.keys(errors).length > 0) {
    return next(new ValidationException('User registration validation failed', errors));
  }

  req.body.name = name.trim();
  req.body.email = email.trim().toLowerCase();
  next();
}

/**
 * Validate password change payload
 */
export function validatePasswordChange(req: Request, _res: Response, next: NextFunction) {
  const { currentPassword, newPassword } = req.body;
  const errors: Record<string, string> = {};

  if (!currentPassword || typeof currentPassword !== 'string') {
    errors.currentPassword = 'Current password is required';
  }

  const passwordCheck = validatePasswordStrength(newPassword);
  if (!passwordCheck.valid) {
    errors.newPassword = passwordCheck.error || 'New password does not meet security requirements';
  }

  if (currentPassword === newPassword) {
    errors.newPassword = 'New password cannot be the same as the current password';
  }

  if (Object.keys(errors).length > 0) {
    return next(new ValidationException('Password change validation failed', errors));
  }

  next();
}

// ========================================================
// STOCK / INVENTORY VALIDATORS
// ========================================================

/**
 * Validate creation of a new stock inventory item
 */
export function validateCreateStock(req: Request, _res: Response, next: NextFunction) {
  const { code, name, category, quantity, status, min_threshold, minThreshold } = req.body;
  const errors: Record<string, string> = {};

  if (!code || typeof code !== 'string' || code.trim().length < 2) {
    errors.code = 'Item code/SKU is required (minimum 2 characters)';
  }

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.name = 'Item name is required (minimum 2 characters)';
  }

  if (!category || typeof category !== 'string' || category.trim().length === 0) {
    errors.category = 'Item category is required';
  }

  const parsedQty = Number(quantity);
  if (isNaN(parsedQty) || parsedQty < 0) {
    errors.quantity = 'Quantity must be a non-negative number';
  }

  const threshold = min_threshold ?? minThreshold;
  if (threshold !== undefined) {
    const parsedThreshold = Number(threshold);
    if (isNaN(parsedThreshold) || parsedThreshold < 0) {
      errors.min_threshold = 'Minimum threshold must be a non-negative number';
    }
  }

  if (status && !['in_stock', 'low_stock', 'out_of_stock'].includes(status)) {
    errors.status = "Status must be one of: 'in_stock', 'low_stock', 'out_of_stock'";
  }

  if (Object.keys(errors).length > 0) {
    return next(new ValidationException('Stock item validation failed', errors));
  }

  req.body.code = code.trim().toUpperCase();
  req.body.name = name.trim();
  req.body.quantity = parsedQty;
  next();
}

/**
 * Validate update of an existing stock item
 */
export function validateUpdateStock(req: Request, _res: Response, next: NextFunction) {
  const { quantity, min_threshold, minThreshold, status } = req.body;
  const errors: Record<string, string> = {};

  if (quantity !== undefined) {
    const parsedQty = Number(quantity);
    if (isNaN(parsedQty) || parsedQty < 0) {
      errors.quantity = 'Quantity must be a non-negative number';
    } else {
      req.body.quantity = parsedQty;
    }
  }

  const threshold = min_threshold ?? minThreshold;
  if (threshold !== undefined) {
    const parsedThreshold = Number(threshold);
    if (isNaN(parsedThreshold) || parsedThreshold < 0) {
      errors.min_threshold = 'Minimum threshold must be a non-negative number';
    }
  }

  if (status && !['in_stock', 'low_stock', 'out_of_stock'].includes(status)) {
    errors.status = "Status must be one of: 'in_stock', 'low_stock', 'out_of_stock'";
  }

  if (Object.keys(errors).length > 0) {
    return next(new ValidationException('Stock update validation failed', errors));
  }

  next();
}

// ========================================================
// HARDWARE ASSET VALIDATORS
// ========================================================

/**
 * Validate creation of a new hardware asset device
 */
export function validateCreateAsset(req: Request, _res: Response, next: NextFunction) {
  const serial = req.body.serial_number || req.body.serialNumber || req.body.serial;
  const { name, model, status, total_units, totalUnits } = req.body;
  const errors: Record<string, string> = {};

  if (!serial || typeof serial !== 'string' || serial.trim().length < 2) {
    errors.serial_number = 'Device serial number is required';
  }

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.name = 'Asset equipment name is required';
  }

  if (!model || typeof model !== 'string' || model.trim().length === 0) {
    errors.model = 'Device model/specs are required';
  }

  const units = total_units ?? totalUnits;
  if (units !== undefined) {
    const parsedUnits = Number(units);
    if (isNaN(parsedUnits) || parsedUnits < 1) {
      errors.total_units = 'Total units must be at least 1';
    }
  }

  if (status && !['operational', 'in_use', 'maintenance'].includes(status)) {
    errors.status = "Asset status must be one of: 'operational', 'in_use', 'maintenance'";
  }

  if (Object.keys(errors).length > 0) {
    return next(new ValidationException('Asset registration validation failed', errors));
  }

  next();
}

/**
 * Validate asset update
 */
export function validateUpdateAsset(req: Request, _res: Response, next: NextFunction) {
  const { status, total_units, totalUnits } = req.body;
  const errors: Record<string, string> = {};

  if (status && !['operational', 'in_use', 'maintenance'].includes(status)) {
    errors.status = "Asset status must be one of: 'operational', 'in_use', 'maintenance'";
  }

  const units = total_units ?? totalUnits;
  if (units !== undefined) {
    const parsedUnits = Number(units);
    if (isNaN(parsedUnits) || parsedUnits < 1) {
      errors.total_units = 'Total units must be at least 1';
    }
  }

  if (Object.keys(errors).length > 0) {
    return next(new ValidationException('Asset update validation failed', errors));
  }

  next();
}

// ========================================================
// LOAN VALIDATORS
// ========================================================

/**
 * Validate equipment checkout loan
 */
export function validateCheckoutLoan(req: Request, _res: Response, next: NextFunction) {
  const assetId = req.body.asset_id || req.body.assetId;
  const borrowerName = req.body.borrower_name || req.body.borrowerName;
  const expectedReturnDate = req.body.expected_return_date || req.body.expectedReturnDate;
  const borrowerRole = req.body.borrower_role || req.body.borrowerRole;
  const errors: Record<string, string> = {};

  if (!assetId || typeof assetId !== 'string' || !UUID_REGEX.test(assetId.trim())) {
    errors.asset_id = 'A valid asset UUID is required for checkout';
  }

  if (!borrowerName || typeof borrowerName !== 'string' || borrowerName.trim().length < 2) {
    errors.borrower_name = 'Borrower name is required';
  }

  if (!expectedReturnDate || typeof expectedReturnDate !== 'string' || !DATE_REGEX.test(expectedReturnDate.trim())) {
    errors.expected_return_date = 'Expected return date must be in YYYY-MM-DD format';
  }

  const allowedRoles = ['Student', 'Lecturer', 'Lab Assistant', 'Technician'];
  if (borrowerRole && !allowedRoles.includes(borrowerRole)) {
    errors.borrower_role = `Borrower role must be one of: ${allowedRoles.join(', ')}`;
  }

  if (Object.keys(errors).length > 0) {
    return next(new ValidationException('Loan checkout validation failed', errors));
  }

  next();
}

// ========================================================
// LOCATION VALIDATORS
// ========================================================

/**
 * Validate laboratory location creation
 */
export function validateCreateLocation(req: Request, _res: Response, next: NextFunction) {
  const { code, name, room, building, capacity } = req.body;
  const errors: Record<string, string> = {};

  if (!code || typeof code !== 'string' || code.trim().length < 2) {
    errors.code = 'Location code is required (e.g. L102B)';
  }

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.name = 'Location name is required';
  }

  if (!room || typeof room !== 'string' || room.trim().length === 0) {
    errors.room = 'Room designation is required';
  }

  if (!building || typeof building !== 'string' || building.trim().length === 0) {
    errors.building = 'Building designation is required';
  }

  if (capacity !== undefined) {
    const parsedCap = Number(capacity);
    if (isNaN(parsedCap) || parsedCap < 1) {
      errors.capacity = 'Capacity must be at least 1 person';
    }
  }

  if (Object.keys(errors).length > 0) {
    return next(new ValidationException('Location validation failed', errors));
  }

  next();
}
