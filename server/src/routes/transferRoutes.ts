import { Router } from 'express';
import { getTransfers, getTransferById, createTransfer } from '../controllers/transferController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Apply authentication to all transfer routes
router.use(authenticate);

router.get('/', getTransfers);
router.get('/:id', getTransferById);
router.post('/', createTransfer);

export default router;

