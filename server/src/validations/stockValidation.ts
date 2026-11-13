import { Request, Response, NextFunction } from 'express';
import { ValidationException } from '@/exceptions/errorHandler.js';
import { isValidImageUrl } from '@/validations/commonValidation.js';

const VALID_STOCK_STATUSES = ['in_stock', 'low_stock', 'out_of_stock'];
const MAX_QUANTITY = 1_000_000;

/**
 * Validate creation of a new stock inventory item
 */
export function validateCreateStock(req: Request, _res: Response, next: NextFunction) {
  const { code, name, category, quantity, status, min_threshold, minThreshold } = req.body;
  const imageUrl = req.body.image_url ?? req.body.imageUrl;
  const errors: Record<string, string> = {};

  if (!code || typeof code !== 'string' || code.trim().length < 2 || code.trim().length > 100) {
    errors.code = 'Item code/SKU must be between 2 and 100 characters';
  }

  if (!name || typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 200) {
    errors.name = 'Item name must be between 2 and 200 characters';
  }

  if (!category || typeof category !== 'string' || category.trim().length === 0) {
    errors.category = 'Item category is required';
  }

  const parsedQty = Number(quantity);
  if (!Number.isInteger(parsedQty) || parsedQty < 0 || parsedQty > MAX_QUANTITY) {
    errors.quantity = `Quantity must be a non-negative integer up to ${MAX_QUANTITY}`;
  }

  const threshold = min_threshold ?? minThreshold;
  if (threshold !== undefined) {
    const parsedThreshold = Number(threshold);
    if (!Number.isInteger(parsedThreshold) || parsedThreshold < 0 || parsedThreshold > MAX_QUANTITY) {
      errors.min_threshold = `Minimum threshold must be a non-negative integer up to ${MAX_QUANTITY}`;
    }
  }

  if (status && !VALID_STOCK_STATUSES.includes(status)) {
    errors.status = `Status must be one of: ${VALID_STOCK_STATUSES.join(', ')}`;
  }

  if (!isValidImageUrl(imageUrl)) {
    errors.image_url = 'Image URL must use http(s), local path, or PNG/JPG/WebP/GIF data URI';
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
  const imageUrl = req.body.image_url ?? req.body.imageUrl;
  const errors: Record<string, string> = {};

  if (quantity !== undefined) {
    const parsedQty = Number(quantity);
    if (!Number.isInteger(parsedQty) || parsedQty < 0 || parsedQty > MAX_QUANTITY) {
      errors.quantity = `Quantity must be a non-negative integer up to ${MAX_QUANTITY}`;
    } else {
      req.body.quantity = parsedQty;
    }
  }

  const threshold = min_threshold ?? minThreshold;
  if (threshold !== undefined) {
    const parsedThreshold = Number(threshold);
    if (!Number.isInteger(parsedThreshold) || parsedThreshold < 0 || parsedThreshold > MAX_QUANTITY) {
      errors.min_threshold = `Minimum threshold must be a non-negative integer up to ${MAX_QUANTITY}`;
    }
  }

  if (status && !VALID_STOCK_STATUSES.includes(status)) {
    errors.status = `Status must be one of: ${VALID_STOCK_STATUSES.join(', ')}`;
  }

  if (!isValidImageUrl(imageUrl)) {
    errors.image_url = 'Image URL must use http(s), local path, or PNG/JPG/WebP/GIF data URI';
  }

  if (Object.keys(errors).length > 0) {
    return next(new ValidationException('Stock update validation failed', errors));
  }

  next();
}

/**
 * Validate atomic stock quantity adjustment delta
 */
export function validateAdjustStock(req: Request, _res: Response, next: NextFunction) {
  const rawDelta =
    req.body.delta ??
    req.body.quantityChange ??
    req.body.quantity_change ??
    req.body.amount ??
    req.body.change;
  const delta = Number(rawDelta);

  if (!Number.isInteger(delta) || delta === 0 || Math.abs(delta) > MAX_QUANTITY) {
    return next(
      new ValidationException(
        `Adjustment delta must be a non-zero integer within +/-${MAX_QUANTITY}`,
        { delta: 'Must be a non-zero integer' }
      )
    );
  }

  next();
}

