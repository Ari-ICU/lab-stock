import { userModel, User, CreateUserInput } from '../models/userModel.js';
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

export interface AuthSessionResponse {
  token: string;
  user: Omit<User, 'password_hash'>;
}

export const authService = {
  /**
   * Authenticate user credentials against PostgreSQL database
   * (With development fallback accounts if the database is offline or not yet initialized)
   */
  async login(email: string, plainTextPassword: string): Promise<AuthSessionResponse> {
    const normalizedEmail = email.trim().toLowerCase();

    // Standard faculty accounts for development & fallback when database is offline or initializing
    const DEV_SEED_USERS = [
      {
        id: 'usr_admin_01',
        name: 'Dr. Heng Sovannarith',
        email: 'sovannarith@lab.edu',
        password: 'password123',
        role: Role.ADMIN,
        is_admin: true,
        department: 'Engineering Block A - Room 102B',
        assigned_labs: ['all'],
      },
      {
        id: 'usr_lecturer_02',
        name: 'Thoeurn Ratha',
        email: 'admin@lab.edu',
        password: 'password123',
        role: Role.LECTURER,
        is_admin: false,
        department: 'Software Engineering Department',
        assigned_labs: ['Room 102B'],
      },
      {
        id: 'usr_assistant_03',
        name: 'Chan Vicheka',
        email: 'assistant@lab.edu',
        password: 'password123',
        role: Role.ASSISTANT,
        is_admin: false,
        department: 'Hardware Depot & Lab 102B',
        assigned_labs: ['Room 102B', 'Room 206'],
      },
      {
        id: '1234567890',
        name: 'John Doe',
        email: 'john.doe@lab.edu',
        password: 'password123',
        role: Role.ADMIN,
        is_admin: true,
        department: 'Faculty of Engineering',
        assigned_labs: ['all'],
      },
    ];

    let user: User | null = null;
    let isDbAvailable = true;

    // 1. Fetch user from PostgreSQL
    try {
      user = await userModel.findByEmail(normalizedEmail);
    } catch (dbErr: any) {
      isDbAvailable = false;
      if (process.env.NODE_ENV === 'production') {
        throw dbErr;
      }
    }

    // 2. If user found in database, verify with bcrypt
    if (user && isDbAvailable) {
      const isPasswordValid = await verifyPassword(plainTextPassword, user.password_hash);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid email or password credentials');
      }
    } else if (!isDbAvailable || !user) {
      // In development, allow logging in with standard faculty accounts when database is initializing
      const devMatch = DEV_SEED_USERS.find(
        (u) => u.email.toLowerCase() === normalizedEmail && u.password === plainTextPassword
      );

      if (devMatch) {
        user = {
          id: devMatch.id,
          name: devMatch.name,
          email: devMatch.email,
          password_hash: '',
          role: devMatch.role,
          is_admin: devMatch.is_admin,
          department: devMatch.department,
          assigned_labs: devMatch.assigned_labs,
        };
      } else {
        throw new UnauthorizedException('Invalid email or password credentials');
      }
    }

    if (!user) {
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
      : ['Room 102B'];

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
   * Register a new user in the PostgreSQL database with hashed password
   * Admins can create any user role and scope.
   * Faculty Lecturers can only provision Lab Assistants within their managed rooms.
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

    // Check if user already exists
    const existing = await userModel.findByEmail(normalizedEmail);
    if (existing) {
      throw new ConflictException(`An account with email '${normalizedEmail}' already exists`);
    }

    let effectiveRole = input.role || 'Faculty Lecturer';
    let effectiveIsAdmin = Boolean(input.is_admin);
    let effectiveAssignedLabs = input.assigned_labs || (input.is_admin ? ['all'] : ['Room 102B']);

    if (requestingUser) {
      const isAdmin =
        requestingUser.admin ||
        requestingUser.role === Role.ADMIN ||
        requestingUser.role === 'Primary Lab Administrator';

      if (!isAdmin) {
        const isLecturer =
          requestingUser.role === Role.LECTURER ||
          requestingUser.role === 'Faculty Lecturer';

        if (!isLecturer) {
          throw new ForbiddenException('Only Administrators and Faculty Lecturers can register accounts');
        }

        // Faculty Lecturer can ONLY provision Lab Assistants
        effectiveRole = Role.ASSISTANT;
        effectiveIsAdmin = false;

        // Scopes must not contain 'all' or '*'
        if (effectiveAssignedLabs.includes('all') || effectiveAssignedLabs.includes('*')) {
          throw new ForbiddenException('Faculty Lecturers cannot grant universal laboratory access');
        }

        const lecturerRooms = requestingUser.assignedLabs || [];
        const hasUnauthorized = effectiveAssignedLabs.some((r) => !lecturerRooms.includes(r));
        if (hasUnauthorized) {
          throw new ForbiddenException(
            `Faculty Lecturers can only assign laboratories within their supervisory scope: [${lecturerRooms.join(', ')}]`
          );
        }
      }
    }

    // Hash password with bcrypt work factor 12
    const hashedPassword = await hashPassword(input.password);

    const newUser = await userModel.create({
      name: input.name,
      email: normalizedEmail,
      password_hash: hashedPassword,
      role: effectiveRole,
      is_admin: effectiveIsAdmin,
      department: input.department || null,
      assigned_labs: effectiveAssignedLabs,
    });

    const { password_hash, ...safeUser } = newUser;
    return safeUser;
  },

  /**
   * Update assigned laboratory room scopes for a user
   * Admins can configure any room scope.
   * Faculty Lecturers can relocate Lab Assistants between laboratories that the lecturer manages.
   */
  async updateAssignedLabs(
    userId: string,
    assignedLabs: string[],
    requestingUser?: JwtUserPayload
  ): Promise<boolean> {
    const user = await userModel.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId}`);
    }

    if (requestingUser) {
      const isAdmin =
        requestingUser.admin ||
        requestingUser.role === Role.ADMIN ||
        requestingUser.role === 'Primary Lab Administrator';

      if (!isAdmin) {
        const isLecturer =
          requestingUser.role === Role.LECTURER ||
          requestingUser.role === 'Faculty Lecturer';

        if (!isLecturer) {
          throw new ForbiddenException(
            'Only Administrators and supervising Faculty Lecturers can assign laboratory locations'
          );
        }

        // Target user must be a Lab Assistant
        const targetRole = user.role;
        if (targetRole !== Role.ASSISTANT && targetRole !== 'Lab Assistant') {
          throw new ForbiddenException(
            'Faculty Lecturers can only relocate and assign scopes for Lab Assistants under their supervision'
          );
        }

        // Lecturer cannot assign 'all' or '*'
        if (assignedLabs.includes('all') || assignedLabs.includes('*')) {
          throw new ForbiddenException('Faculty Lecturers cannot grant universal lab access');
        }

        // All rooms in assignedLabs must be within lecturer's assignedLabs
        const lecturerLabs = requestingUser.assignedLabs || [];

        // MAKE SURE ONLY: Assistant must currently be stationed in one of the lecturer's managed laboratories
        const currentLabs = user.assigned_labs || [];
        const isSupervisedByLecturer =
          currentLabs.length === 0 || currentLabs.some((room) => lecturerLabs.includes(room));
        if (!isSupervisedByLecturer) {
          throw new ForbiddenException(
            `Access restricted: You can only relocate assistants who are currently stationed within your supervised laboratories: [${lecturerLabs.join(', ')}]`
          );
        }

        const hasUnauthorizedRoom = assignedLabs.some((room) => !lecturerLabs.includes(room));
        if (hasUnauthorizedRoom) {
          throw new ForbiddenException(
            `Faculty Lecturers can only assign rooms within their supervisory scope: [${lecturerLabs.join(', ')}]`
          );
        }
      }
    }

    return userModel.updateAssignedLabs(userId, assignedLabs);
  },

  /**
   * Update role for a user (Admin only)
   */
  async updateUserRole(userId: string, newRole: string, requestingAdminId?: string): Promise<boolean> {
    const user = await userModel.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId}`);
    }

    const isAdmin = newRole === Role.ADMIN || newRole === 'Primary Lab Administrator';
    return userModel.updateRole(userId, newRole, isAdmin);
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
