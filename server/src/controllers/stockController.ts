import { Request, Response } from 'express';
import { stockService } from '@/services/stockService.js';
import { asyncHandler, ValidationException } from '@/exceptions/errorHandler.js';

/**
 * GET /api/v1/stock
 * List all consumables/stock items with optional category, status, and search filters
 */
export const getStockItems = asyncHandler(async (req: Request, res: Response) => {
  const { category, status, search } = req.query;

  const items = await stockService.getAll({
    category: category ? String(category) : undefined,
    status: status ? String(status) : undefined,
    search: search ? String(search) : undefined,
  });

  return res.status(200).json({
    status: 'ok',
    count: items.length,
    data: items,
  });
});

/**
 * GET /api/v1/stock/:id
 * Retrieve a specific stock item by ID
 */
export const getStockItemById = asyncHandler(async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const item = await stockService.getById(id);

  return res.status(200).json({
    status: 'ok',
    data: item,
  });
});

/**
 * POST /api/v1/stock
 * Create a new inventory item
 */
export const createStockItem = asyncHandler(async (req: Request, res: Response) => {
  const newItem = await stockService.create(req.body);

  return res.status(201).json({
    status: 'ok',
    message: 'Stock item registered successfully',
    data: newItem,
  });
});

/**
 * PUT /api/v1/stock/:id
 * Update an existing inventory item
 */
export const updateStockItem = asyncHandler(async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const updated = await stockService.update(id, req.body);

  return res.status(200).json({
    status: 'ok',
    message: 'Stock item updated successfully',
    data: updated,
  });
});

/**
 * PATCH /api/v1/stock/:id/adjust
 * Concurrency-safe atomic quantity increment/decrement (+5 or -1)
 */
export const adjustStockQuantity = asyncHandler(async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const delta = Number(req.body.delta ?? req.body.amount);

  if (isNaN(delta) || delta === 0) {
    throw new ValidationException('Field "delta" or "amount" is required and must be a non-zero number');
  }

  const updated = await stockService.adjustQuantity(id, delta);

  return res.status(200).json({
    status: 'ok',
    message: `Stock quantity adjusted successfully by ${delta > 0 ? '+' : ''}${delta}`,
    data: updated,
  });
});

/**
 * DELETE /api/v1/stock/:id
 * Delete an inventory item
 */
export const deleteStockItem = asyncHandler(async (req: Request, res: Response) => {
  const id = String(req.params.id);
  await stockService.delete(id);

  return res.status(200).json({
    status: 'ok',
    message: 'Stock item deleted successfully',
  });
});
