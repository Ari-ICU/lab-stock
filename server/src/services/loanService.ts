import { loanModel, Loan } from '../models/loanModel.js';
import { assetModel } from '../models/assetModel.js';
import { NotFoundException, ConflictException, ValidationException } from '../exceptions/errorHandler.js';

export const loanService = {
  async getAll(status?: string): Promise<Loan[]> {
    return loanModel.findAll(status);
  },

  async getById(id: string): Promise<Loan> {
    const loan = await loanModel.findById(id);
    if (!loan) {
      throw new NotFoundException(`Loan record with ID ${id}`);
    }
    return loan;
  },

  /**
   * Check out equipment to student or faculty borrower
   */
  async checkout(data: any): Promise<Loan> {
    const assetId = data.asset_id || data.assetId;
    const borrowerName = data.borrower_name || data.borrowerName;
    const expectedReturnDate = data.expected_return_date || data.expectedReturnDate;

    if (!assetId || !borrowerName || !expectedReturnDate) {
      throw new ValidationException('Asset ID, borrower name, and expected return date are required');
    }

    const asset = await assetModel.findById(assetId);
    if (!asset) {
      throw new NotFoundException(`Equipment device with ID ${assetId}`);
    }

    if (asset.loan_status === 'on_loan') {
      throw new ConflictException(
        `Device '${asset.name}' (SN: ${asset.serial_number}) is currently on loan to ${asset.current_borrower || 'another borrower'}`
      );
    }

    const borrowerRole = data.borrower_role || data.borrowerRole || 'Student';

    // 1. Create loan record
    const loan = await loanModel.create({
      asset_id: assetId,
      borrower_name: borrowerName,
      borrower_role: borrowerRole,
      borrower_contact: data.borrower_contact || data.borrowerContact || null,
      course_or_class: data.course_or_class || data.courseOrClass || null,
      borrow_date: data.borrow_date || data.borrowDate || new Date().toISOString().split('T')[0],
      expected_return_date: expectedReturnDate,
      status: 'active',
      notes: data.notes || null,
    });

    // 2. Transition asset state to on_loan
    await assetModel.update(asset.id, {
      loan_status: 'on_loan',
      current_borrower: `${borrowerName} (${borrowerRole})`,
      loan_due_date: expectedReturnDate,
    });

    return loan;
  },

  /**
   * Check in returned equipment & record condition inspection notes
   */
  async checkin(loanId: string, notes?: string): Promise<Loan> {
    const loan = await this.getById(loanId);

    if (loan.status === 'returned') {
      throw new ConflictException(`Loan record ${loanId} is already marked as returned`);
    }

    // 1. Update loan record
    const updatedLoan = await loanModel.returnLoan(loanId, notes);
    if (!updatedLoan) {
      throw new NotFoundException(`Loan ${loanId}`);
    }

    // 2. Release asset state back to available
    await assetModel.update(loan.asset_id, {
      loan_status: 'available',
      current_borrower: undefined,
      loan_due_date: undefined,
    });

    return updatedLoan;
  },
};
