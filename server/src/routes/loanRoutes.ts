import { Router } from 'express';
import {
  getLoans,
  getLoanById,
  checkoutEquipment,
  checkinEquipment,
} from '@/controllers/loanController.js';
import { authenticate, requirePermission, requireLocationScope } from '@/middleware/auth.js';
import { validateCheckoutLoan } from '@/middleware/validate.js';
import { Permission } from '@/constants/permissions.js';
import { assetService } from '@/services/assetService.js';
import { loanService } from '@/services/loanService.js';

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
 * @desc    Check out equipment device to borrower with DTO validation and location scope check
 * @access  Protected (Requires loans:checkout + Room Scope)
 */
router.post(
  '/checkout',
  requirePermission(Permission.LOAN_CHECKOUT),
  requireLocationScope(async (req) => {
    const assetId = String(req.body.asset_id || req.body.assetId || '');
    if (!assetId) return null;
    const a = await assetService.getById(assetId);
    return a?.placement_rack || a?.location_name;
  }),
  validateCheckoutLoan,
  checkoutEquipment
);

/**
 * @route   POST /api/v1/loans/:id/return
 * @desc    Check in returned device with location scope check
 * @access  Protected (Requires loans:return + Room Scope)
 */
router.post(
  '/:id/return',
  requirePermission(Permission.LOAN_RETURN),
  requireLocationScope(async (req) => {
    const loan = await loanService.getById(String(req.params.id));
    if (loan?.asset_id) {
      const a = await assetService.getById(loan.asset_id);
      return a?.placement_rack || a?.location_name;
    }
    return null;
  }),
  checkinEquipment
);

export default router;
