import { query } from '../config/database.js';
import { DatabaseException } from '../exceptions/errorHandler.js';

export interface User {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: string;
  is_admin: boolean;
  department?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface CreateUserInput {
  name: string;
  email: string;
  password_hash: string;
  role?: string;
  is_admin?: boolean;
  department?: string | null;
}

export const userModel = {
  /**
   * Find a user by their unique email address (case-insensitive)
   */
  async findByEmail(email: string): Promise<User | null> {
    try {
      const res = await query(
        'SELECT id, name, email, password_hash, role, is_admin, department, created_at, updated_at FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1',
        [email.trim()]
      );
      return res.rows[0] || null;
    } catch (err: any) {
      throw new DatabaseException(`Failed to lookup user by email: ${err.message}`, err);
    }
  },

  /**
   * Find a user by their primary UUID
   */
  async findById(id: string): Promise<User | null> {
    if (!id || typeof id !== 'string') return null;

    // Check if id matches UUID syntax before querying PostgreSQL uuid column
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id.trim());
    if (!isUuid) {
      return null;
    }

    try {
      const res = await query(
        'SELECT id, name, email, password_hash, role, is_admin, department, created_at, updated_at FROM users WHERE id = $1 LIMIT 1',
        [id.trim()]
      );
      return res.rows[0] || null;
    } catch (err: any) {
      throw new DatabaseException(`Failed to lookup user by id: ${err.message}`, err);
    }
  },

  /**
   * Create a new user with hashed credentials
   */
  async create(user: CreateUserInput): Promise<User> {
    try {
      const res = await query(
        `INSERT INTO users (name, email, password_hash, role, is_admin, department)
         VALUES ($1, LOWER($2), $3, $4, $5, $6)
         RETURNING id, name, email, password_hash, role, is_admin, department, created_at, updated_at`,
        [
          user.name.trim(),
          user.email.trim(),
          user.password_hash,
          user.role || 'Faculty Lecturer',
          Boolean(user.is_admin),
          user.department || null,
        ]
      );
      return res.rows[0];
    } catch (err: any) {
      throw new DatabaseException(`Failed to persist user: ${err.message}`, err);
    }
  },

  /**
   * Update user password hash
   */
  async updatePassword(id: string, newPasswordHash: string): Promise<boolean> {
    try {
      const res = await query(
        'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [newPasswordHash, id]
      );
      return (res.rowCount ?? 0) > 0;
    } catch (err: any) {
      throw new DatabaseException(`Failed to update user password: ${err.message}`, err);
    }
  },

  /**
   * List all users without exposing password hash
   */
  async findAll(): Promise<Omit<User, 'password_hash'>[]> {
    try {
      const res = await query(
        'SELECT id, name, email, role, is_admin, department, created_at FROM users ORDER BY created_at DESC'
      );
      return res.rows;
    } catch (err: any) {
      throw new DatabaseException(`Failed to query user accounts: ${err.message}`, err);
    }
  },

  /**
   * Check if any users exist in the database (for initial setup/seeding check)
   */
  async count(): Promise<number> {
    try {
      const res = await query('SELECT COUNT(*)::int as count FROM users');
      return res.rows[0]?.count || 0;
    } catch (err: any) {
      throw new DatabaseException(`Failed to count users: ${err.message}`, err);
    }
  },
};
