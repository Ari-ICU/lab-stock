import { Request, Response } from 'express';
import { locationService } from '@/services/locationService.js';
import { asyncHandler } from '@/exceptions/errorHandler.js';

/**
 * GET /api/v1/locations
 * List all lab rooms and facilities
 */
export const getLocations = asyncHandler(async (_req: Request, res: Response) => {
  const locations = await locationService.getAll();

  return res.status(200).json({
    status: 'ok',
    count: locations.length,
    data: locations,
  });
});

/**
 * GET /api/v1/locations/:id
 * Retrieve location by ID
 */
export const getLocationById = asyncHandler(async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const location = await locationService.getById(id);

  return res.status(200).json({
    status: 'ok',
    data: location,
  });
});

/**
 * POST /api/v1/locations
 * Add a new laboratory facility or room
 */
export const createLocation = asyncHandler(async (req: Request, res: Response) => {
  const newLocation = await locationService.create(req.body);

  return res.status(201).json({
    status: 'ok',
    message: 'Lab location registered successfully',
    data: newLocation,
  });
});

/**
 * PUT /api/v1/locations/:id
 * Update an existing laboratory facility
 */
export const updateLocation = asyncHandler(async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const updated = await locationService.update(id, req.body);

  return res.status(200).json({
    status: 'ok',
    message: 'Lab location updated successfully',
    data: updated,
  });
});

/**
 * DELETE /api/v1/locations/:id
 * Remove a laboratory facility
 */
export const deleteLocation = asyncHandler(async (req: Request, res: Response) => {
  const id = String(req.params.id);
  await locationService.delete(id);

  return res.status(200).json({
    status: 'ok',
    message: 'Lab location deleted successfully',
  });
});
