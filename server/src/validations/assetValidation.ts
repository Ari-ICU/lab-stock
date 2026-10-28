import { Request, Response, NextFunction } from 'express';
import { ValidationException } from '../exceptions/errorHandler.js';

const VALID_ASSET_STATUSES = ['operational', 'in_use', 'maintenance'];

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
    errors.model = 'Device model/specifications are required';
  }

  const units = total_units ?? totalUnits;
  if (units !== undefined) {
    const parsedUnits = Number(units);
    if (isNaN(parsedUnits) || parsedUnits < 1) {
      errors.total_units = 'Total units must be at least 1';
    }
  }

  if (status && !VALID_ASSET_STATUSES.includes(status)) {
    errors.status = `Asset status must be one of: ${VALID_ASSET_STATUSES.join(', ')}`;
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

  if (status && !VALID_ASSET_STATUSES.includes(status)) {
    errors.status = `Asset status must be one of: ${VALID_ASSET_STATUSES.join(', ')}`;
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

