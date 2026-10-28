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
  async checkout(data: Omit<Loan, 'id' | 'status' | 'actual_return_date' | 'created_at'>): Promise<Loan> {
    if (!data.asset_id || !data.borrower_name || !data.expected_return_date) {
      throw new ValidationException('Asset ID, borrower name, and expected return date are required');
    }

    const asset = await assetModel.findById(data.asset_id);
    if (!asset) {
      throw new NotFoundException(`Equipment device with ID ${data.asset_id}`);
    }

    if (asset.loan_status === 'on_loan') {
      throw new ConflictException(
        `Device '${asset.name}' (SN: ${asset.serial_number}) is currently on loan to ${asset.current_borrower || 'another borrower'}`
      );
    }

    // 1. Create loan record
    const loan = await loanModel.create({
      ...data,
      status: 'active',
    });

    // 2. Transition asset state to on_loan
    await assetModel.update(asset.id, {
      loan_status: 'on_loan',
      current_borrower: `${data.borrower_name} (${data.borrower_role})`,
      loan_due_date: data.expected_return_date,
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
