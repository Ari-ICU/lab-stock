import { Request, Response, NextFunction } from 'express';
import { ValidationException } from '@/exceptions/errorHandler.js';

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

  req.body.code = code.trim().toUpperCase();
  req.body.name = name.trim();
  req.body.room = room.trim();
  req.body.building = building.trim();
  next();
}

