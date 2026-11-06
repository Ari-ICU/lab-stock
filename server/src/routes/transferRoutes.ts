import { Router } from 'express';
import { getTransfers, getTransferById, createTransfer } from '../controllers/transferController.js';
import { authenticate, requirePermission, requireAnyPermission } from '../middleware/auth.js';
import { Permission } from '../constants/permissions.js';

const router = Router();

// Apply authentication to all transfer routes
router.use(authenticate);

router.get('/', requirePermission(Permission.ASSET_READ), getTransfers);
router.get('/:id', requirePermission(Permission.ASSET_READ), getTransferById);
router.post(
  '/',
  requireAnyPermission(Permission.ASSET_UPDATE, Permission.LOCATION_MANAGE, Permission.LOAN_CHECKOUT),
  createTransfer
);

export default router;
