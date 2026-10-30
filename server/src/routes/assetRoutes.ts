import { Router } from 'express';
import {
  getAssets,
  getAssetById,
  createAsset,
  updateAsset,
  deleteAsset,
} from '@/controllers/assetController.js';
import { authenticate, requirePermission, requireLocationScope } from '@/middleware/auth.js';
import { validateCreateAsset, validateUpdateAsset } from '@/middleware/validate.js';
import { Permission } from '@/constants/permissions.js';
import { assetService } from '@/services/assetService.js';

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
 * @desc    Register a new hardware asset with DTO validation and location scope check
 * @access  Protected (Requires assets:create + Room Scope)
 */
router.post(
  '/',
  requirePermission(Permission.ASSET_CREATE),
  requireLocationScope((req) => req.body.placement_rack || req.body.location || req.body.placementRack),
  validateCreateAsset,
  createAsset
);

/**
 * @route   PUT /api/v1/assets/:id
 * @desc    Update hardware asset details with DTO validation and location scope check
 * @access  Protected (Requires assets:update + Room Scope)
 */
router.put(
  '/:id',
  requirePermission(Permission.ASSET_UPDATE),
  requireLocationScope(async (req) => {
    const a = await assetService.getById(String(req.params.id));
    const currentLoc = [a?.location_room, a?.placement_rack, a?.location_name].filter(Boolean).join(' ');
    const newLoc = req.body.placement_rack || req.body.location || req.body.placementRack;
    return [currentLoc, newLoc].filter(Boolean);
  }),
  validateUpdateAsset,
  updateAsset
);

/**
 * @route   DELETE /api/v1/assets/:id
 * @desc    Delete hardware asset with location scope check
 * @access  Protected (Requires assets:delete + Room Scope)
 */
router.delete(
  '/:id',
  requirePermission(Permission.ASSET_DELETE),
  requireLocationScope(async (req) => {
    const a = await assetService.getById(String(req.params.id));
    return [a?.location_room, a?.placement_rack, a?.location_name].filter(Boolean).join(' ');
  }),
  deleteAsset
);

export default router;
