import { Router } from 'express';
import {
  getStockItems,
  getStockItemById,
  createStockItem,
  updateStockItem,
  adjustStockQuantity,
  deleteStockItem,
} from '@/controllers/stockController.js';
import { authenticate, requirePermission, requireLocationScope } from '@/middleware/auth.js';
import { validateCreateStock, validateUpdateStock } from '@/middleware/validate.js';
import { Permission } from '@/constants/permissions.js';
import { stockService } from '@/services/stockService.js';

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
 * @desc    Create a new stock item with DTO validation and location scope check
 * @access  Protected (Requires stock:create + Room Scope)
 */
router.post(
  '/',
  requirePermission(Permission.STOCK_CREATE),
  requireLocationScope((req) => req.body.rack || req.body.location),
  validateCreateStock,
  createStockItem
);

/**
 * @route   PUT /api/v1/stock/:id
 * @desc    Update an existing stock item with DTO validation and location scope check
 * @access  Protected (Requires stock:update + Room Scope)
 */
router.put(
  '/:id',
  requirePermission(Permission.STOCK_UPDATE),
  requireLocationScope(async (req) => {
    const s = await stockService.getById(String(req.params.id));
    const currentLoc = [s?.location_room, s?.rack, s?.location_name].filter(Boolean).join(' ');
    const newLoc = req.body.rack || req.body.location;
    return [currentLoc, newLoc].filter(Boolean);
  }),
  validateUpdateStock,
  updateStockItem
);

/**
 * @route   PATCH /api/v1/stock/:id/quantity or /api/v1/stock/:id/adjust
 * @desc    Atomic quantity adjustment (+delta / -delta) safe for concurrent users with location scope check
 * @access  Protected (Requires stock:update + Room Scope)
 */
router.patch(
  ['/:id/quantity', '/:id/adjust'],
  requirePermission(Permission.STOCK_UPDATE),
  requireLocationScope(async (req) => {
    const s = await stockService.getById(String(req.params.id));
    return [s?.location_room, s?.rack, s?.location_name].filter(Boolean).join(' ');
  }),
  adjustStockQuantity
);

/**
 * @route   DELETE /api/v1/stock/:id
 * @desc    Delete a stock item with location scope check
 * @access  Protected (Requires stock:delete + Room Scope)
 */
router.delete(
  '/:id',
  requirePermission(Permission.STOCK_DELETE),
  requireLocationScope(async (req) => {
    const s = await stockService.getById(String(req.params.id));
    return [s?.location_room, s?.rack, s?.location_name].filter(Boolean).join(' ');
  }),
  deleteStockItem
);

export default router;
