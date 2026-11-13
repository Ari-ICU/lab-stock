import { Router } from 'express';
import {
  getPurchaseRequests,
  getPurchaseRequestById,
  createPurchaseRequest,
  updatePurchaseRequest,
  updatePurchaseRequestStatus,
  deletePurchaseRequest,
} from '@/controllers/purchaseRequestController.js';
import { authenticate, requirePermission, requireAdmin } from '@/middleware/auth.js';
import { Permission } from '@/constants/permissions.js';

const router = Router();

// Apply authentication
router.use(authenticate);

router.get('/', requirePermission(Permission.STOCK_READ), getPurchaseRequests);
router.get('/:id', requirePermission(Permission.STOCK_READ), getPurchaseRequestById);
router.post('/', requirePermission(Permission.STOCK_CREATE), createPurchaseRequest);
router.put('/:id', requirePermission(Permission.STOCK_UPDATE), updatePurchaseRequest);
router.patch('/:id/status', requireAdmin, updatePurchaseRequestStatus);
router.delete('/:id', requireAdmin, deletePurchaseRequest);

export default router;

