export interface CheckoutLoanDto {
  asset_id?: string;
  assetId?: string;
  borrower_name?: string;
  borrowerName?: string;
  borrower_role?: 'Student' | 'Lecturer' | 'Lab Assistant' | 'Technician' | string;
  borrowerRole?: 'Student' | 'Lecturer' | 'Lab Assistant' | 'Technician' | string;
  borrower_contact?: string;
  borrowerContact?: string;
  course_or_class?: string;
  courseOrClass?: string;
  borrow_date?: string;
  borrowDate?: string;
  expected_return_date?: string;
  expectedReturnDate?: string;
  notes?: string;
}

export interface ReturnLoanDto {
  notes?: string;
}

export interface LoanFilterQueryDto {
  status?: 'active' | 'returned' | 'overdue' | string;
}

