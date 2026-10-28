import { userModel, User, CreateUserInput } from '../models/userModel.js';
import { signToken, verifyToken, JwtUserPayload } from '../utils/jwt.js';
import { hashPassword, verifyPassword, validatePasswordStrength } from '../utils/password.js';
import { DEFAULT_ROLE_PERMISSIONS, Permission, Role } from '../constants/permissions.js';
import {
  UnauthorizedException,
  ConflictException,
  ValidationException,
  NotFoundException,
} from '../exceptions/errorHandler.js';

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

    // 1. Fetch user from PostgreSQL
    const user = await userModel.findByEmail(normalizedEmail);

    if (!user) {
      // Use uniform message to prevent account enumeration
      throw new UnauthorizedException('Invalid email or password credentials');
    }

    // 2. Cryptographic password verification (bcrypt)
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

    // 4. Issue cryptographically signed JWT
    const token = signToken({
      sub: user.id,
      name: user.name,
      email: user.email,
      admin: Boolean(user.is_admin),
      role: user.role,
      permissions,
      department: user.department || undefined,
    });

    const { password_hash, ...safeUser } = user;
    return { token, user: safeUser };
  },

  /**
   * Register a new user in the PostgreSQL database with hashed password
   */
  async register(input: {
    name: string;
    email: string;
    password: string;
    role?: string;
    is_admin?: boolean;
    department?: string | null;
  }): Promise<Omit<User, 'password_hash'>> {
    const normalizedEmail = input.email.trim().toLowerCase();

    // Check if user already exists
    const existing = await userModel.findByEmail(normalizedEmail);
    if (existing) {
      throw new ConflictException(`An account with email '${normalizedEmail}' already exists`);
    }

    // Hash password with bcrypt work factor 12
    const hashedPassword = await hashPassword(input.password);

    const newUser = await userModel.create({
      name: input.name,
      email: normalizedEmail,
      password_hash: hashedPassword,
      role: input.role || 'Faculty Lecturer',
      is_admin: Boolean(input.is_admin),
      department: input.department || null,
    });

    const { password_hash, ...safeUser } = newUser;
    return safeUser;
  },

  /**
   * Retrieve authenticated user profile by primary UUID
   */
  async getUserProfile(userId: string): Promise<Omit<User, 'password_hash'>> {
    const user = await userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User account');
    }
    const { password_hash, ...safeUser } = user;
    return safeUser;
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
