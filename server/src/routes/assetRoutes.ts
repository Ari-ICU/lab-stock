import { Router, Request } from 'express';
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
import { locationModel } from '@/models/locationModel.js';

const router = Router();

async function resolveAssetBodyLocation(req: Request): Promise<string[]> {
  const parts = [req.body.location, req.body.placement_rack, req.body.placementRack]
    .filter((v): v is string => typeof v === 'string' && v.trim().length > 0);
  const locId = req.body.location_id || req.body.locationId;
  if (typeof locId === 'string' && locId.trim()) {
    const loc = await locationModel.findById(locId.trim());
    if (loc) {
      if (loc.room) parts.push(loc.room);
      if (loc.name) parts.push(loc.name);
    }
  }
  return parts;
}

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
  validateCreateAsset,
  requireLocationScope(async (req) => resolveAssetBodyLocation(req)),
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
  validateUpdateAsset,
  requireLocationScope(async (req) => {
    const a = await assetService.getById(String(req.params.id));
    const currentLoc = [a?.location_room, a?.location_name, a?.placement_rack].filter(Boolean).join(' ');
    const nextLocs = await resolveAssetBodyLocation(req);
    return [currentLoc, ...nextLocs].filter(Boolean);
  }),
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
