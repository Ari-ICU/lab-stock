import { Router } from 'express';
import {
  getPurchaseRequests,
  getPurchaseRequestById,
  createPurchaseRequest,
  updatePurchaseRequestStatus,
  deletePurchaseRequest,
} from '@/controllers/purchaseRequestController.js';
import { authenticate } from '@/middleware/auth.js';

const router = Router();

// Apply authentication
router.use(authenticate);

router.get('/', getPurchaseRequests);
router.get('/:id', getPurchaseRequestById);
router.post('/', createPurchaseRequest);
router.patch('/:id/status', updatePurchaseRequestStatus);
router.put('/:id', updatePurchaseRequestStatus);
router.delete('/:id', deletePurchaseRequest);

export default router;

