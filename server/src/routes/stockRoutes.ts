import { Router } from 'express';
import {
  getStockItems,
  getStockItemById,
  createStockItem,
  updateStockItem,
  deleteStockItem,
} from '@/controllers/stockController.js';
import { authenticate, requirePermission } from '@/middleware/auth.js';
import { validateCreateStock, validateUpdateStock } from '@/middleware/validate.js';
import { Permission } from '@/constants/permissions.js';

const router = Router();

// Apply authentication to all stock routes
router.use(authenticate);

/**
 * @route   GET /api/v1/stock
 * @desc    Get all inventory/stock items (supports ?category=&status=&search=)
 * @access  Protected (Requires stock:read)
 */
router.get('/', requirePermission(Permission.STOCK_READ), getStockItems);

/**
 * @route   GET /api/v1/stock/:id
 * @desc    Get single stock item by ID
 * @access  Protected (Requires stock:read)
 */
router.get('/:id', requirePermission(Permission.STOCK_READ), getStockItemById);

/**
 * @route   POST /api/v1/stock
 * @desc    Create a new stock item with DTO validation
 * @access  Protected (Requires stock:create)
 */
router.post(
  '/',
  requirePermission(Permission.STOCK_CREATE),
  validateCreateStock,
  createStockItem
);

/**
 * @route   PUT /api/v1/stock/:id
 * @desc    Update an existing stock item with DTO validation
 * @access  Protected (Requires stock:update)
 */
router.put(
  '/:id',
  requirePermission(Permission.STOCK_UPDATE),
  validateUpdateStock,
  updateStockItem
);

/**
 * @route   DELETE /api/v1/stock/:id
 * @desc    Delete a stock item
 * @access  Protected (Requires stock:delete)
 */
router.delete('/:id', requirePermission(Permission.STOCK_DELETE), deleteStockItem);

export default router;
