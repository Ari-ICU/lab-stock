import { Request, Response, NextFunction } from 'express';
import { ValidationException } from '@/exceptions/errorHandler.js';
import { isValidImageUrl } from '@/validations/commonValidation.js';

const VALID_ASSET_STATUSES = ['operational', 'in_use', 'maintenance'];
const VALID_LOAN_STATUSES = ['available', 'on_loan'];
const MAX_UNITS = 100_000;

/**
 * Validate creation of a new hardware asset device
 */
export function validateCreateAsset(req: Request, _res: Response, next: NextFunction) {
  const serial = req.body.serial_number || req.body.serialNumber || req.body.serial;
  const { name, model, status, total_units, totalUnits } = req.body;
  const loanStatus = req.body.loan_status ?? req.body.loanStatus;
  const imageUrl = req.body.image_url ?? req.body.imageUrl;
  const errors: Record<string, string> = {};

  if (!serial || typeof serial !== 'string' || serial.trim().length < 2 || serial.trim().length > 100) {
    errors.serial_number = 'Device serial number is required (2-100 characters)';
  }

  if (!name || typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 200) {
    errors.name = 'Asset equipment name is required (2-200 characters)';
  }

  if (!model || typeof model !== 'string' || model.trim().length === 0 || model.trim().length > 200) {
    errors.model = 'Device model/specifications are required';
  }

  const units = total_units ?? totalUnits;
  if (units !== undefined) {
    const parsedUnits = Number(units);
    if (!Number.isInteger(parsedUnits) || parsedUnits < 1 || parsedUnits > MAX_UNITS) {
      errors.total_units = `Total units must be an integer between 1 and ${MAX_UNITS}`;
    }
  }

  if (status && !VALID_ASSET_STATUSES.includes(status)) {
    errors.status = `Asset status must be one of: ${VALID_ASSET_STATUSES.join(', ')}`;
  }

  if (loanStatus && !VALID_LOAN_STATUSES.includes(loanStatus)) {
    errors.loan_status = `Loan status must be one of: ${VALID_LOAN_STATUSES.join(', ')}`;
  }

  if (!isValidImageUrl(imageUrl)) {
    errors.image_url = 'Image URL must use http(s), local path, or PNG/JPG/WebP/GIF data URI';
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
  const loanStatus = req.body.loan_status ?? req.body.loanStatus;
  const imageUrl = req.body.image_url ?? req.body.imageUrl;
  const errors: Record<string, string> = {};

  if (status && !VALID_ASSET_STATUSES.includes(status)) {
    errors.status = `Asset status must be one of: ${VALID_ASSET_STATUSES.join(', ')}`;
  }

  if (loanStatus && !VALID_LOAN_STATUSES.includes(loanStatus)) {
    errors.loan_status = `Loan status must be one of: ${VALID_LOAN_STATUSES.join(', ')}`;
  }

  const units = total_units ?? totalUnits;
  if (units !== undefined) {
    const parsedUnits = Number(units);
    if (!Number.isInteger(parsedUnits) || parsedUnits < 1 || parsedUnits > MAX_UNITS) {
      errors.total_units = `Total units must be an integer between 1 and ${MAX_UNITS}`;
    }
  }

  if (!isValidImageUrl(imageUrl)) {
    errors.image_url = 'Image URL must use http(s), local path, or PNG/JPG/WebP/GIF data URI';
  }

  if (Object.keys(errors).length > 0) {
    return next(new ValidationException('Asset update validation failed', errors));
  }

  next();
}

