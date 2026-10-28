import { Request, Response, NextFunction } from 'express';
import { ValidationException } from '@/exceptions/errorHandler.js';
import { isValidUuid, isValidDateFormat } from '@/validations/commonValidation.js';

const ALLOWED_BORROWER_ROLES = ['Student', 'Lecturer', 'Lab Assistant', 'Technician'];

/**
 * Validate equipment checkout loan
 */
export function validateCheckoutLoan(req: Request, _res: Response, next: NextFunction) {
  const assetId = req.body.asset_id || req.body.assetId;
  const borrowerName = req.body.borrower_name || req.body.borrowerName;
  const expectedReturnDate = req.body.expected_return_date || req.body.expectedReturnDate;
  const borrowerRole = req.body.borrower_role || req.body.borrowerRole;
  const errors: Record<string, string> = {};

  if (!assetId || !isValidUuid(assetId)) {
    errors.asset_id = 'A valid asset UUID is required for checkout';
  }

  if (!borrowerName || typeof borrowerName !== 'string' || borrowerName.trim().length < 2) {
    errors.borrower_name = 'Borrower name is required (minimum 2 characters)';
  }

  if (!expectedReturnDate || !isValidDateFormat(expectedReturnDate)) {
    errors.expected_return_date = 'Expected return date must be in YYYY-MM-DD format';
  }

  if (borrowerRole && !ALLOWED_BORROWER_ROLES.includes(borrowerRole)) {
    errors.borrower_role = `Borrower role must be one of: ${ALLOWED_BORROWER_ROLES.join(', ')}`;
  }

  if (Object.keys(errors).length > 0) {
    return next(new ValidationException('Loan checkout validation failed', errors));
  }

  next();
}

/**
 * Validate equipment return notes
 */
export function validateReturnLoan(req: Request, _res: Response, next: NextFunction) {
  const { notes } = req.body;
  const errors: Record<string, string> = {};

  if (notes !== undefined && typeof notes !== 'string') {
    errors.notes = 'Inspection notes must be a string text';
  }

  if (Object.keys(errors).length > 0) {
    return next(new ValidationException('Loan return validation failed', errors));
  }

  next();
}

