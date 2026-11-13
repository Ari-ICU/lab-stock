import { Request, Response } from 'express';
import { categoryModel } from '../models/categoryModel.js';
import { asyncHandler, ValidationException } from '../exceptions/errorHandler.js';
import { isValidUuid } from '../validations/commonValidation.js';

/**
 * List all categories stored in PostgreSQL
 */
export const getCategories = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await categoryModel.findAll();
  res.json({
    success: true,
    count: categories.length,
    data: categories,
  });
});

/**
 * Create (or return existing) category in PostgreSQL
 */
export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const rawName = req.body?.name;
  const rawDescription = req.body?.description;

  if (!rawName || typeof rawName !== 'string' || rawName.trim().length < 2) {
    throw new ValidationException('Category name is required (minimum 2 characters)', {
      name: 'Category name is required (minimum 2 characters)',
    });
  }

  if (rawName.trim().length > 100) {
    throw new ValidationException('Category name must be 100 characters or fewer', {
      name: 'Category name must be 100 characters or fewer',
    });
  }

  const category = await categoryModel.ensureExists(
    rawName,
    typeof rawDescription === 'string' ? rawDescription : undefined
  );

  res.status(201).json({
    success: true,
    message: 'Category stored in database',
    data: category,
  });
});

/**
 * Delete a category by ID
 */
export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  const id = String(req.params.id);
  if (!isValidUuid(id)) {
    throw new ValidationException('Invalid category UUID');
  }

  const deleted = await categoryModel.delete(id);

  res.json({
    success: deleted,
    message: deleted ? 'Category deleted' : 'Category not found',
  });
});

