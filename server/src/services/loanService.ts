import { loanModel, Loan } from '../models/loanModel.js';
import { NotFoundException, ConflictException, ValidationException } from '../exceptions/errorHandler.js';
import { withTransaction } from '../config/database.js';
import { cache } from '../utils/cache.js';

export const loanService = {
  async getAll(status?: string): Promise<Loan[]> {
    const cacheKey = `loan:list:${status || 'all'}`;
    return cache.getOrSet(cacheKey, () => loanModel.findAll(status), 30000);
  },

  async getById(id: string): Promise<Loan> {
    const loan = await loanModel.findById(id);
    if (!loan) {
      throw new NotFoundException(`Loan record with ID ${id}`);
    }
    return loan;
  },

  /**
   * Check out equipment to student or faculty borrower with strict pessimistic row locking
   * to guarantee no double-booking when multiple users check out simultaneously.
   */
  async checkout(data: any): Promise<Loan> {
    const assetId = data.asset_id || data.assetId;
    const borrowerName = data.borrower_name || data.borrowerName;
    const expectedReturnDate = data.expected_return_date || data.expectedReturnDate;

    if (!assetId || !borrowerName || !expectedReturnDate) {
      throw new ValidationException('Asset ID, borrower name, and expected return date are required');
    }

    const borrowerRole = data.borrower_role || data.borrowerRole || 'Student';

    const newLoan = await withTransaction(async (client) => {
      // 1. Lock the asset row! Any concurrent user checkout will wait until this transaction completes
      const assetRes = await client.query(
        `SELECT id, name, serial_number, loan_status, current_borrower 
         FROM assets 
         WHERE id = $1 
         FOR UPDATE`,
        [assetId]
      );

      if (assetRes.rows.length === 0) {
        throw new NotFoundException(`Equipment device with ID ${assetId}`);
      }

      const asset = assetRes.rows[0];

      if (asset.loan_status === 'on_loan') {
        throw new ConflictException(
          `Device '${asset.name}' (SN: ${asset.serial_number}) is already on loan to ${asset.current_borrower || 'another borrower'}.`
        );
      }

      // 2. Insert the loan record
      const loanRes = await client.query(
        `INSERT INTO loans (asset_id, borrower_name, borrower_role, borrower_contact, course_or_class, borrow_date, expected_return_date, status, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          assetId,
          borrowerName,
          borrowerRole,
          data.borrower_contact || data.borrowerContact || null,
          data.course_or_class || data.courseOrClass || null,
          data.borrow_date || data.borrowDate || new Date().toISOString().split('T')[0],
          expectedReturnDate,
          'active',
          data.notes || null,
        ]
      );

      // 3. Atomically update asset loan status
      await client.query(
        `UPDATE assets 
         SET loan_status = 'on_loan',
             current_borrower = $1,
             loan_due_date = $2,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        [`${borrowerName} (${borrowerRole})`, expectedReturnDate, assetId]
      );

      return loanRes.rows[0];
    });

    // 4. Invalidate related caches instantly so no user receives stale data
    cache.invalidatePattern('loan:');
    cache.invalidatePattern('asset:');

    return newLoan;
  },

  /**
   * Check in returned equipment & record condition inspection notes atomically
   */
  async checkin(loanId: string, notes?: string): Promise<Loan> {
    const today = new Date().toISOString().split('T')[0];

    const updatedLoan = await withTransaction(async (client) => {
      // 1. Lock the loan row to prevent concurrent check-ins
      const loanRes = await client.query(
        `SELECT * FROM loans WHERE id = $1 FOR UPDATE`,
        [loanId]
      );

      if (loanRes.rows.length === 0) {
        throw new NotFoundException(`Loan record with ID ${loanId}`);
      }

      const loan = loanRes.rows[0];
      if (loan.status === 'returned') {
        throw new ConflictException(`Loan record ${loanId} is already marked as returned`);
      }

      // 2. Mark loan as returned
      const updateLoanRes = await client.query(
        `UPDATE loans 
         SET status = 'returned', actual_return_date = $1, notes = COALESCE($2, notes)
         WHERE id = $3
         RETURNING *`,
        [today, notes || null, loanId]
      );

      // 3. Release asset state back to available
      await client.query(
        `UPDATE assets 
         SET loan_status = 'available',
             current_borrower = NULL,
             loan_due_date = NULL,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [loan.asset_id]
      );

      return updateLoanRes.rows[0];
    });

    // Invalidate cache immediately
    cache.invalidatePattern('loan:');
    cache.invalidatePattern('asset:');

    return updatedLoan;
  },
};
