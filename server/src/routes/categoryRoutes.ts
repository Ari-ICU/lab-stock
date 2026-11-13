import { Router } from 'express';
import {
  getCategories,
  createCategory,
  deleteCategory,
} from '@/controllers/categoryController.js';
import { authenticate, requirePermission } from '@/middleware/auth.js';
import { Permission } from '@/constants/permissions.js';

const router = Router();

router.use(authenticate);

/**
 * @route   GET /api/v1/categories
 * @desc    Get all inventory categories stored in PostgreSQL
 * @access  Protected (Requires stock:read)
 */
router.get('/', requirePermission(Permission.STOCK_READ), getCategories);

/**
 * @route   POST /api/v1/categories
 * @desc    Create and store a new inventory category in PostgreSQL
 * @access  Protected (Requires stock:create)
 */
router.post('/', requirePermission(Permission.STOCK_CREATE), createCategory);

/**
 * @route   DELETE /api/v1/categories/:id
 * @desc    Delete an inventory category
 * @access  Protected (Requires stock:delete)
 */
router.delete('/:id', requirePermission(Permission.STOCK_DELETE), deleteCategory);

export default router;

