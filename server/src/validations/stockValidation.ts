import { Request, Response, NextFunction } from 'express';
import { ValidationException } from '../exceptions/errorHandler.js';

const VALID_STOCK_STATUSES = ['in_stock', 'low_stock', 'out_of_stock'];

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

  if (status && !VALID_STOCK_STATUSES.includes(status)) {
    errors.status = `Status must be one of: ${VALID_STOCK_STATUSES.join(', ')}`;
  }

  if (Object.keys(errors).length > 0) {
    return next(new ValidationException('Stock item creation validation failed', errors));
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

  if (status && !VALID_STOCK_STATUSES.includes(status)) {
    errors.status = `Status must be one of: ${VALID_STOCK_STATUSES.join(', ')}`;
  }

  if (Object.keys(errors).length > 0) {
    return next(new ValidationException('Stock update validation failed', errors));
  }

  next();
}

