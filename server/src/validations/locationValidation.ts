import { Request, Response, NextFunction } from 'express';
import { ValidationException } from '@/exceptions/errorHandler.js';
import { isValidUuid } from '@/validations/commonValidation.js';

const VALID_INVENTORY_GROUPS = ['FURNITURE', 'ELECTRICAL', 'IT_HARDWARE', 'SAFETY_MISC'];
const VALID_COUNT_FIELDS = ['qtyWorking', 'qtyBroken', 'qtyMaintenance'];
const MAX_COUNT = 100_000;

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
    if (!Number.isInteger(parsedCap) || parsedCap < 1 || parsedCap > 10_000) {
      errors.capacity = 'Capacity must be an integer between 1 and 10000';
    }
  }

  if (Object.keys(errors).length > 0) {
    return next(new ValidationException('Location validation failed', errors));
  }

  req.body.code = code.trim().toUpperCase();
  req.body.name = name.trim();
  req.body.room = room.trim();
  req.body.building = building.trim();
  next();
}

/**
 * Validate laboratory location update
 */
export function validateUpdateLocation(req: Request, _res: Response, next: NextFunction) {
  const { name, room, building, capacity, floor } = req.body;
  const errors: Record<string, string> = {};

  if (name !== undefined && (typeof name !== 'string' || name.trim().length < 2)) {
    errors.name = 'Location name must be at least 2 characters';
  }

  if (room !== undefined && (typeof room !== 'string' || room.trim().length === 0)) {
    errors.room = 'Room designation cannot be empty';
  }

  if (building !== undefined && (typeof building !== 'string' || building.trim().length === 0)) {
    errors.building = 'Building designation cannot be empty';
  }

  if (capacity !== undefined) {
    const parsedCap = Number(capacity);
    if (!Number.isInteger(parsedCap) || parsedCap < 1 || parsedCap > 10_000) {
      errors.capacity = 'Capacity must be an integer between 1 and 10000';
    }
  }

  if (floor !== undefined) {
    const parsedFloor = Number(floor);
    if (!Number.isInteger(parsedFloor) || parsedFloor < -10 || parsedFloor > 100) {
      errors.floor = 'Floor must be a valid integer';
    }
  }

  if (Object.keys(errors).length > 0) {
    return next(new ValidationException('Location update validation failed', errors));
  }

  next();
}

/**
 * Validate creation of a room inventory item
 */
export function validateAddRoomInventory(req: Request, _res: Response, next: NextFunction) {
  const { name } = req.body;
  const group = req.body.group ?? req.body.group_type;
  const qtyWorking = req.body.qtyWorking ?? req.body.qty_working;
  const qtyBroken = req.body.qtyBroken ?? req.body.qty_broken;
  const qtyMaintenance = req.body.qtyMaintenance ?? req.body.qty_maintenance;
  const stockItemId = req.body.stockItemId ?? req.body.stock_item_id;
  const assetId = req.body.assetId ?? req.body.asset_id;
  const errors: Record<string, string> = {};

  if (!name || typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 150) {
    errors.name = 'Item name must be between 2 and 150 characters';
  }

  if (group !== undefined && !VALID_INVENTORY_GROUPS.includes(group)) {
    errors.group = `Group must be one of: ${VALID_INVENTORY_GROUPS.join(', ')}`;
  }

  for (const [key, val] of [
    ['qtyWorking', qtyWorking],
    ['qtyBroken', qtyBroken],
    ['qtyMaintenance', qtyMaintenance],
  ] as const) {
    if (val !== undefined) {
      const n = Number(val);
      if (!Number.isInteger(n) || n < 0 || n > MAX_COUNT) {
        errors[key] = `${key} must be a non-negative integer up to ${MAX_COUNT}`;
      }
    }
  }

  if (stockItemId !== undefined && stockItemId !== null && stockItemId !== '' && !isValidUuid(stockItemId)) {
    errors.stockItemId = 'stockItemId must be a valid UUID';
  }

  if (assetId !== undefined && assetId !== null && assetId !== '' && !isValidUuid(assetId)) {
    errors.assetId = 'assetId must be a valid UUID';
  }

  if (Object.keys(errors).length > 0) {
    return next(new ValidationException('Room inventory item validation failed', errors));
  }

  req.body.name = name.trim();
  next();
}

/**
 * Validate full update of a room inventory item
 */
export function validateUpdateRoomInventory(req: Request, _res: Response, next: NextFunction) {
  const itemId = String(req.params.itemId || '');
  const errors: Record<string, string> = {};

  if (!isValidUuid(itemId)) {
    errors.itemId = 'Invalid room inventory item UUID';
  }

  const { name } = req.body;
  const group = req.body.group ?? req.body.group_type;
  const qtyWorking = req.body.qtyWorking ?? req.body.qty_working;
  const qtyBroken = req.body.qtyBroken ?? req.body.qty_broken;
  const qtyMaintenance = req.body.qtyMaintenance ?? req.body.qty_maintenance;
  const stockItemId = req.body.stockItemId ?? req.body.stock_item_id;
  const assetId = req.body.assetId ?? req.body.asset_id;

  if (name !== undefined && (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 150)) {
    errors.name = 'Item name must be between 2 and 150 characters';
  }

  if (group !== undefined && !VALID_INVENTORY_GROUPS.includes(group)) {
    errors.group = `Group must be one of: ${VALID_INVENTORY_GROUPS.join(', ')}`;
  }

  for (const [key, val] of [
    ['qtyWorking', qtyWorking],
    ['qtyBroken', qtyBroken],
    ['qtyMaintenance', qtyMaintenance],
  ] as const) {
    if (val !== undefined) {
      const n = Number(val);
      if (!Number.isInteger(n) || n < 0 || n > MAX_COUNT) {
        errors[key] = `${key} must be a non-negative integer up to ${MAX_COUNT}`;
      }
    }
  }

  if (stockItemId !== undefined && stockItemId !== null && stockItemId !== '' && !isValidUuid(stockItemId)) {
    errors.stockItemId = 'stockItemId must be a valid UUID';
  }

  if (assetId !== undefined && assetId !== null && assetId !== '' && !isValidUuid(assetId)) {
    errors.assetId = 'assetId must be a valid UUID';
  }

  if (Object.keys(errors).length > 0) {
    return next(new ValidationException('Room inventory update validation failed', errors));
  }

  next();
}

/**
 * Validate PATCH delta count adjustment on a room inventory item
 */
export function validateAdjustRoomInventoryCount(req: Request, _res: Response, next: NextFunction) {
  const itemId = String(req.params.itemId || '');
  const { field, delta } = req.body;
  const errors: Record<string, string> = {};

  if (!isValidUuid(itemId)) {
    errors.itemId = 'Invalid room inventory item UUID';
  }

  if (!field || !VALID_COUNT_FIELDS.includes(field)) {
    errors.field = `field must be one of: ${VALID_COUNT_FIELDS.join(', ')}`;
  }

  const parsedDelta = Number(delta);
  if (!Number.isInteger(parsedDelta) || parsedDelta === 0 || Math.abs(parsedDelta) > MAX_COUNT) {
    errors.delta = `delta must be a non-zero integer within +/-${MAX_COUNT}`;
  }

  if (Object.keys(errors).length > 0) {
    return next(new ValidationException('Room inventory count validation failed', errors));
  }

  req.body.delta = parsedDelta;
  next();
}

