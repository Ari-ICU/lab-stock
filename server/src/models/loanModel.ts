import { query } from '../config/database.js';

export interface Loan {
  id: string;
  asset_id: string;
  asset_name?: string;
  serial_number?: string;
  borrower_name: string;
  borrower_role: string;
  borrower_contact?: string;
  course_or_class?: string;
  borrow_date: string;
  expected_return_date: string;
  actual_return_date?: string;
  status: 'active' | 'returned' | 'overdue';
  notes?: string;
  created_at?: Date;
}

export const loanModel = {
  async findAll(status?: string): Promise<Loan[]> {
    try {
      let sql = `
        SELECT l.*, a.name as asset_name, a.serial_number 
        FROM loans l
        JOIN assets a ON l.asset_id = a.id
        WHERE 1=1
      `;
      const params: any[] = [];

      if (status && status !== 'all') {
        params.push(status);
        sql += ` AND l.status = $${params.length}`;
      }

      sql += ' ORDER BY l.borrow_date DESC';

      const res = await query(sql, params);
      return res.rows;
    } catch {
      return [];
    }
  },

  async findById(id: string): Promise<Loan | null> {
    try {
      const res = await query(
        `SELECT l.*, a.name as asset_name, a.serial_number 
         FROM loans l
         JOIN assets a ON l.asset_id = a.id
         WHERE l.id = $1 LIMIT 1`,
        [id]
      );
      return res.rows[0] || null;
    } catch {
      return null;
    }
  },

  async create(loan: Omit<Loan, 'id' | 'created_at'>): Promise<Loan> {
    const res = await query(
      `INSERT INTO loans (asset_id, borrower_name, borrower_role, borrower_contact, course_or_class, borrow_date, expected_return_date, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        loan.asset_id,
        loan.borrower_name,
        loan.borrower_role,
        loan.borrower_contact || null,
        loan.course_or_class || null,
        loan.borrow_date,
        loan.expected_return_date,
        loan.status || 'active',
        loan.notes || null,
      ]
    );
    return res.rows[0];
  },

  async returnLoan(id: string, notes?: string): Promise<Loan | null> {
    const today = new Date().toISOString().split('T')[0];
    const res = await query(
      `UPDATE loans 
       SET status = 'returned', actual_return_date = $1, notes = COALESCE($2, notes)
       WHERE id = $3
       RETURNING *`,
      [today, notes || null, id]
    );
    return res.rows[0] || null;
  },
};

