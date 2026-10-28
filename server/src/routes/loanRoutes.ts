import { Router } from 'express';
import {
  getLoans,
  getLoanById,
  checkoutEquipment,
  checkinEquipment,
} from '../controllers/loanController.js';
import { authenticate, requirePermission } from '../middleware/auth.js';
import { Permission } from '../constants/permissions.js';

const router = Router();

// Apply authentication to all loan routes
router.use(authenticate);

/**
 * @route   GET /api/v1/loans
 * @desc    Get all loans (supports ?status=active|returned|overdue)
 * @access  Protected (Requires loans:read)
 */
router.get('/', requirePermission(Permission.LOAN_READ), getLoans);

/**
 * @route   GET /api/v1/loans/:id
 * @desc    Get single loan transaction record
 * @access  Protected (Requires loans:read)
 */
router.get('/:id', requirePermission(Permission.LOAN_READ), getLoanById);

/**
 * @route   POST /api/v1/loans/checkout
 * @desc    Check out equipment device to borrower
 * @access  Protected (Requires loans:checkout)
 */
router.post('/checkout', requirePermission(Permission.LOAN_CHECKOUT), checkoutEquipment);

/**
 * @route   POST /api/v1/loans/:id/return
 * @desc    Check in returned device and log condition inspection notes
 * @access  Protected (Requires loans:return)
 */
router.post('/:id/return', requirePermission(Permission.LOAN_RETURN), checkinEquipment);

export default router;
