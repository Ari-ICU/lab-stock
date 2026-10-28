import { Request, Response } from 'express';
import { loanService } from '../services/loanService.js';
import { asyncHandler } from '../exceptions/errorHandler.js';

/**
 * GET /api/v1/loans
 * List device loans with optional status filter ('active', 'returned', 'overdue')
 */
export const getLoans = asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.query;

  const loans = await loanService.getAll(status ? String(status) : undefined);

  return res.status(200).json({
    status: 'ok',
    count: loans.length,
    data: loans,
  });
});

/**
 * GET /api/v1/loans/:id
 * Retrieve a single loan record
 */
export const getLoanById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const loan = await loanService.getById(id);

  return res.status(200).json({
    status: 'ok',
    data: loan,
  });
});

/**
 * POST /api/v1/loans/checkout
 * Check out equipment to student or faculty borrower
 */
export const checkoutEquipment = asyncHandler(async (req: Request, res: Response) => {
  const newLoan = await loanService.checkout(req.body);

  return res.status(201).json({
    status: 'ok',
    message: 'Equipment successfully checked out',
    data: newLoan,
  });
});

/**
 * POST /api/v1/loans/:id/return
 * Check in returned equipment and record inspection notes
 */
export const checkinEquipment = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { notes } = req.body;

  const returnedLoan = await loanService.checkin(id, notes);

  return res.status(200).json({
    status: 'ok',
    message: 'Equipment returned and released to available inventory',
    data: returnedLoan,
  });
});
