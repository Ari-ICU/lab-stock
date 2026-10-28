import { Router } from 'express';
import {
  getAssets,
  getAssetById,
  createAsset,
  updateAsset,
  deleteAsset,
} from '../controllers/assetController.js';
import { authenticate, requirePermission } from '../middleware/auth.js';
import { Permission } from '../constants/permissions.js';

const router = Router();

// Apply authentication to all asset routes
router.use(authenticate);

/**
 * @route   GET /api/v1/assets
 * @desc    Get all hardware assets (supports ?status=&search=)
 * @access  Protected (Requires assets:read)
 */
router.get('/', requirePermission(Permission.ASSET_READ), getAssets);

/**
 * @route   GET /api/v1/assets/:id
 * @desc    Get single hardware asset by ID
 * @access  Protected (Requires assets:read)
 */
router.get('/:id', requirePermission(Permission.ASSET_READ), getAssetById);

/**
 * @route   POST /api/v1/assets
 * @desc    Register a new hardware asset
 * @access  Protected (Requires assets:create)
 */
router.post('/', requirePermission(Permission.ASSET_CREATE), createAsset);

/**
 * @route   PUT /api/v1/assets/:id
 * @desc    Update hardware asset details
 * @access  Protected (Requires assets:update)
 */
router.put('/:id', requirePermission(Permission.ASSET_UPDATE), updateAsset);

/**
 * @route   DELETE /api/v1/assets/:id
 * @desc    Delete hardware asset
 * @access  Protected (Requires assets:delete)
 */
router.delete('/:id', requirePermission(Permission.ASSET_DELETE), deleteAsset);

export default router;
