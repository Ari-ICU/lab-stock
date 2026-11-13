import { Router } from 'express';
import { getTransfers, getTransferById, createTransfer } from '../controllers/transferController.js';
import {
  authenticate,
  requirePermission,
  requireAnyPermission,
  requireLocationScope,
} from '../middleware/auth.js';
import { validateCreateTransfer } from '../middleware/validate.js';
import { Permission } from '../constants/permissions.js';
import { assetService } from '../services/assetService.js';
import { locationModel } from '../models/locationModel.js';

const router = Router();

// Apply authentication to all transfer routes
router.use(authenticate);

router.get('/', requirePermission(Permission.ASSET_READ), getTransfers);
router.get('/:id', requirePermission(Permission.ASSET_READ), getTransferById);
router.post(
  '/',
  requireAnyPermission(Permission.ASSET_UPDATE, Permission.LOCATION_MANAGE, Permission.LOAN_CHECKOUT),
  validateCreateTransfer,
  requireLocationScope(async (req) => {
    const assetId = String(req.body.asset_id || req.body.assetId || '');
    const asset = await assetService.getById(assetId);
    const locations: string[] = [];

    const sourceLoc = [asset?.location_room, asset?.location_name, asset?.placement_rack]
      .filter(Boolean)
      .join(' ');
    if (sourceLoc) locations.push(sourceLoc);

    const rawTo = req.body.to_location_id || req.body.toLocationId || req.body.to_location || req.body.toLocation;
    if (typeof rawTo === 'string' && rawTo.trim()) {
      const targetLoc = await locationModel.findById(rawTo.trim());
      if (targetLoc) {
        locations.push([targetLoc.room, targetLoc.name].filter(Boolean).join(' '));
      } else {
        locations.push(rawTo.trim());
      }
    }

    return locations;
  }),
  createTransfer
);

export default router;
