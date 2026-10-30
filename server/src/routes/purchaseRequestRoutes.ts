import { Router } from 'express';
import {
  getPurchaseRequests,
  getPurchaseRequestById,
  createPurchaseRequest,
  updatePurchaseRequest,
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
router.put('/:id', updatePurchaseRequest);
router.patch('/:id/status', updatePurchaseRequestStatus);
router.delete('/:id', deletePurchaseRequest);

export default router;

