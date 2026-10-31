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

/**
 * POST /api/v1/locations/:id/inventory
 * Add a room facility inventory item
 */
export const addRoomInventory = asyncHandler(async (req: Request, res: Response) => {
  const roomId = String(req.params.id);
  const item = await locationService.addRoomInventoryItem(roomId, req.body);

  return res.status(201).json({
    status: 'ok',
    message: 'Room inventory item added successfully',
    data: item,
  });
});

/**
 * PATCH /api/v1/locations/inventory/:itemId
 * Update quantity count of a room inventory item
 */
export const updateRoomInventoryCount = asyncHandler(async (req: Request, res: Response) => {
  const itemId = String(req.params.itemId);
  const { field, delta } = req.body;
  const item = await locationService.updateRoomInventoryCount(itemId, field, delta);

  return res.status(200).json({
    status: 'ok',
    message: 'Room inventory count adjusted successfully',
    data: item,
  });
});

/**
 * PUT /api/v1/locations/inventory/:itemId
 * Update entire room inventory item specifications, status, counts, and remarks
 */
export const updateRoomInventoryItem = asyncHandler(async (req: Request, res: Response) => {
  const itemId = String(req.params.itemId);
  const item = await locationService.updateRoomInventoryItem(itemId, req.body);

  return res.status(200).json({
    status: 'ok',
    message: 'Room inventory item updated successfully',
    data: item,
  });
});

/**
 * DELETE /api/v1/locations/inventory/:itemId
 * Remove an item from room inventory
 */
export const deleteRoomInventory = asyncHandler(async (req: Request, res: Response) => {
  const itemId = String(req.params.itemId);
  await locationService.deleteRoomInventoryItem(itemId);

  return res.status(200).json({
    status: 'ok',
    message: 'Room inventory item removed successfully',
  });
});

/**
 * POST /api/v1/locations/:id/audit
 * Mark room audited
 */
export const markRoomAudited = asyncHandler(async (req: Request, res: Response) => {
  const roomId = String(req.params.id);
  const auditorName = req.body.auditorName || req.user?.name || 'Administrator';
  const updatedLocation = await locationService.markAudited(roomId, auditorName);

  return res.status(200).json({
    status: 'ok',
    message: 'Room audit recorded successfully',
    data: updatedLocation,
  });
});
