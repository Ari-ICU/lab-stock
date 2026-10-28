import { Request, Response } from 'express';
import { assetService } from '../services/assetService.js';
import { asyncHandler } from '../exceptions/errorHandler.js';

/**
 * GET /api/v1/assets
 * List all lab hardware assets with optional status and search filters
 */
export const getAssets = asyncHandler(async (req: Request, res: Response) => {
  const { status, search } = req.query;

  const assets = await assetService.getAll({
    status: status ? String(status) : undefined,
    search: search ? String(search) : undefined,
  });

  return res.status(200).json({
    status: 'ok',
    count: assets.length,
    data: assets,
  });
});

/**
 * GET /api/v1/assets/:id
 * Retrieve specific asset by ID
 */
export const getAssetById = asyncHandler(async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const asset = await assetService.getById(id);

  return res.status(200).json({
    status: 'ok',
    data: asset,
  });
});

/**
 * POST /api/v1/assets
 * Register a new hardware device / asset
 */
export const createAsset = asyncHandler(async (req: Request, res: Response) => {
  const newAsset = await assetService.create(req.body);

  return res.status(201).json({
    status: 'ok',
    message: 'Hardware asset registered successfully',
    data: newAsset,
  });
});

/**
 * PUT /api/v1/assets/:id
 * Update an existing asset
 */
export const updateAsset = asyncHandler(async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const updated = await assetService.update(id, req.body);

  return res.status(200).json({
    status: 'ok',
    message: 'Hardware asset updated successfully',
    data: updated,
  });
});

/**
 * DELETE /api/v1/assets/:id
 * Remove an asset from the system
 */
export const deleteAsset = asyncHandler(async (req: Request, res: Response) => {
  const id = String(req.params.id);
  await assetService.delete(id);

  return res.status(200).json({
    status: 'ok',
    message: 'Hardware asset deleted successfully',
  });
});
