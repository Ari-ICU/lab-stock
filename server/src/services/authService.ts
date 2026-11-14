import { userModel, User } from '../models/userModel.js';
import { signToken, verifyToken, JwtUserPayload } from '../utils/jwt.js';
import { hashPassword, verifyPassword, validatePasswordStrength } from '../utils/password.js';
import { DEFAULT_ROLE_PERMISSIONS, Permission, Role } from '../constants/permissions.js';
import {
  UnauthorizedException,
  ConflictException,
  ValidationException,
  NotFoundException,
  ForbiddenException,
} from '../exceptions/errorHandler.js';

const ALLOWED_USER_ROLES = [
  Role.ADMIN,
  Role.LECTURER,
  'Department Administrator',
] as const;

export interface AuthSessionResponse {
  token: string;
  user: Omit<User, 'password_hash'>;
}

export const authService = {
  /**
   * Authenticate user credentials against PostgreSQL database
   */
  async login(email: string, plainTextPassword: string): Promise<AuthSessionResponse> {
    const normalizedEmail = email.trim().toLowerCase();

    // Email aliases mapping legacy @lab.edu addresses to official @rupp.edu.kh university accounts
    const emailAliases: Record<string, string> = {
      'admin@lab.edu': 'thoeurn.ratha@rupp.edu.kh',
      'ratha@lab.edu': 'thoeurn.ratha@rupp.edu.kh',
      'thoeurn.ratha@lab.edu': 'thoeurn.ratha@rupp.edu.kh',
      'sovannarith@lab.edu': 'heng.sovannarith@rupp.edu.kh',
      'heng.sovannarith@lab.edu': 'heng.sovannarith@rupp.edu.kh',
      'assistant@lab.edu': 'chan.vicheka@rupp.edu.kh',
      'vakhim@lab.edu': 'chan.vicheka@rupp.edu.kh',
      'chan.vicheka@lab.edu': 'chan.vicheka@rupp.edu.kh',
    };
    const primaryEmail = emailAliases[normalizedEmail] || normalizedEmail;

    // Strict RBAC: Only Super Admin, Admin, and Lecturer can log in. Lab Assistants have View-Only status.
    if (
      primaryEmail === 'chan.vicheka@rupp.edu.kh' ||
      primaryEmail.includes('assistant') ||
      primaryEmail.includes('vicheka')
    ) {
      throw new ForbiddenException(
        'Login restricted: Lab Assistants possess View-Only inspection status and cannot sign in as operators. Please sign in as Super Admin, Admin, or Lecturer.'
      );
    }

    // 1. Fetch user from PostgreSQL (check primary email, then fallback to original)
    let user = await userModel.findByEmail(primaryEmail);
    if (!user && primaryEmail !== normalizedEmail) {
      user = await userModel.findByEmail(normalizedEmail);
    }

    if (!user) {
      throw new UnauthorizedException('Invalid email or password credentials');
    }

    // 2. Verify credentials strictly against database password hash
    const isPasswordValid = await verifyPassword(plainTextPassword, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password credentials');
    }

    // 3. Determine permissions based on role & admin status using RBAC matrix
    let permissions: string[];
    if (user.is_admin) {
      permissions = [Permission.WILDCARD, 'ALL', 'admin'];
    } else {
      permissions = (DEFAULT_ROLE_PERMISSIONS[user.role] as string[]) || [
        Permission.STOCK_READ,
        Permission.ASSET_READ,
        Permission.LOAN_READ,
      ];
    }

    const assignedLabs = user.assigned_labs && user.assigned_labs.length > 0
      ? user.assigned_labs
      : user.is_admin
      ? ['all']
      : [];

    // 4. Issue cryptographically signed JWT with assigned laboratories scope
    const token = signToken({
      sub: user.id,
      name: user.name,
      email: user.email,
      admin: Boolean(user.is_admin),
      role: user.role,
      permissions,
      department: user.department || undefined,
      assignedLabs,
    });

    const { password_hash, ...safeUser } = user;
    safeUser.assigned_labs = assignedLabs;
    return { token, user: safeUser };
  },

  /**
   * Register a new user in the PostgreSQL database with hashed password (Admin only)
   */
  async register(
    input: {
      name: string;
      email: string;
      password: string;
      role?: string;
      is_admin?: boolean;
      department?: string | null;
      assigned_labs?: string[];
    },
    requestingUser?: JwtUserPayload
  ): Promise<Omit<User, 'password_hash'>> {
    const normalizedEmail = input.email.trim().toLowerCase();

    const isRequesterAdmin =
      Boolean(requestingUser?.admin) ||
      requestingUser?.role === Role.ADMIN;

    if (!isRequesterAdmin) {
      throw new ForbiddenException('Only Administrators can register user accounts');
    }

    // Check if user already exists
    const existing = await userModel.findByEmail(normalizedEmail);
    if (existing) {
      throw new ConflictException(`An account with email '${normalizedEmail}' already exists`);
    }

    const requestedRole = (input.role || Role.LECTURER).trim();
    if (!ALLOWED_USER_ROLES.includes(requestedRole as any)) {
      throw new ValidationException(
        `Invalid role specified. Allowed roles: ${ALLOWED_USER_ROLES.join(', ')}`
      );
    }

    const effectiveIsAdmin =
      requestedRole === Role.ADMIN ||
      requestedRole === 'Department Administrator' ||
      Boolean(input.is_admin);

    const effectiveAssignedLabs = Array.isArray(input.assigned_labs) && input.assigned_labs.length > 0
      ? input.assigned_labs.map((l) => String(l).trim()).filter(Boolean)
      : effectiveIsAdmin
      ? ['all']
      : [];

    // Hash password with bcrypt work factor 12
    const hashedPassword = await hashPassword(input.password);

    const newUser = await userModel.create({
      name: input.name,
      email: normalizedEmail,
      password_hash: hashedPassword,
      role: requestedRole,
      is_admin: effectiveIsAdmin,
      department: input.department || null,
      assigned_labs: effectiveAssignedLabs,
    });

    const { password_hash, ...safeUser } = newUser;
    return safeUser;
  },

  /**
   * Update assigned laboratory room scopes for a user (Admin only)
   */
  async updateAssignedLabs(
    userId: string,
    assignedLabs: string[],
    requestingUser?: JwtUserPayload
  ): Promise<boolean> {
    const isRequesterAdmin =
      Boolean(requestingUser?.admin) ||
      requestingUser?.role === Role.ADMIN;

    if (!isRequesterAdmin) {
      throw new ForbiddenException('Only Administrators can modify laboratory room scopes');
    }

    const cleanedLabs = assignedLabs
      .map((l) => (typeof l === 'string' ? l.trim() : ''))
      .filter(Boolean);

    if (cleanedLabs.length === 0) {
      throw new ValidationException('assignedLabs must contain at least one valid room string');
    }

    const user = await userModel.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId}`);
    }

    return userModel.updateAssignedLabs(userId, cleanedLabs);
  },

  /**
   * Update role for a user (Admin only)
   */
  async updateUserRole(userId: string, newRole: string, requestingAdminId?: string): Promise<boolean> {
    if (requestingAdminId && requestingAdminId === userId) {
      throw new ValidationException('Administrators cannot modify their own active role');
    }

    const trimmedRole = newRole.trim();
    if (!ALLOWED_USER_ROLES.includes(trimmedRole as any)) {
      throw new ValidationException(
        `Invalid role specified. Allowed roles: ${ALLOWED_USER_ROLES.join(', ')}`
      );
    }

    const user = await userModel.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId}`);
    }

    const isAdmin =
      trimmedRole === Role.ADMIN ||
      trimmedRole === 'Department Administrator';
    return userModel.updateRole(userId, trimmedRole, isAdmin);
  },

  /**
   * Delete a user account (Admin only, cannot delete oneself)
   */
  async deleteUser(userId: string, requestingAdminId?: string): Promise<boolean> {
    if (requestingAdminId && requestingAdminId === userId) {
      throw new ValidationException('Administrators cannot delete their own active account');
    }

    const user = await userModel.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId}`);
    }

    return userModel.delete(userId);
  },

  /**
   * List all users
   */
  async getAllUsers(): Promise<Omit<User, 'password_hash'>[]> {
    return userModel.findAll();
  },

  /**
   * Retrieve authenticated user profile by primary UUID or institutional email
   */
  async getUserProfile(userId: string, email?: string): Promise<Omit<User, 'password_hash'> | null> {
    try {
      let user: User | null = null;

      if (userId) {
        user = await userModel.findById(userId);
      }

      if (!user && email) {
        user = await userModel.findByEmail(email);
      }

      if (!user) {
        return null;
      }

      const { password_hash, ...safeUser } = user;
      return safeUser;
    } catch {
      // Graceful fallback to null when DB is unreachable, so JWT claims can be served
      return null;
    }
  },

  /**
   * Change user password securely
   */
  async changePassword(userId: string, currentPass: string, newPass: string): Promise<void> {
    const user = await userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User account');
    }

    const isMatch = await verifyPassword(currentPass, user.password_hash);
    if (!isMatch) {
      throw new UnauthorizedException('Current password does not match');
    }

    const check = validatePasswordStrength(newPass);
    if (!check.valid) {
      throw new ValidationException(check.error || 'Password does not meet security requirements');
    }

    const newHash = await hashPassword(newPass);
    await userModel.updatePassword(userId, newHash);
  },

  /**
   * Cryptographically validate a JWT token
   */
  validateToken(token: string): JwtUserPayload {
    return verifyToken(token);
  },
};
