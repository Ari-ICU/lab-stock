import { Request, Response } from 'express';
import { authService } from '@/services/authService.js';
import { asyncHandler, UnauthorizedException } from '@/exceptions/errorHandler.js';

/**
 * POST /api/v1/auth/login
 * Authenticates user credentials against PostgreSQL and returns signed JWT
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const result = await authService.login(email, password);

  return res.status(200).json({
    status: 'ok',
    message: 'Authentication successful',
    token: result.token,
    user: result.user,
  });
});

/**
 * POST /api/v1/auth/register
 * Creates a new user in PostgreSQL with bcrypt-hashed credentials
 * Supported for Administrators and Faculty Lecturers (for Lab Assistants)
 */
export const register = asyncHandler(async (req: Request, res: Response) => {
  const newUser = await authService.register(req.body, req.user);

  return res.status(201).json({
    status: 'ok',
    message: 'User account created successfully',
    user: newUser,
  });
});

/**
 * GET /api/v1/auth/me
 * Returns currently authenticated user profile
 */
export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new UnauthorizedException('Authentication session expired or missing');
  }

  const dbUser = await authService.getUserProfile(req.user.sub, req.user.email);

  return res.status(200).json({
    status: 'ok',
    user: dbUser || {
      id: req.user.sub,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      is_admin: req.user.admin,
      permissions: req.user.permissions,
      department: req.user.department,
    },
  });
});

/**
 * POST /api/v1/auth/verify
 * Cryptographically validates any JWT token and returns claim introspection
 */
export const verifyTokenEndpoint = asyncHandler(async (req: Request, res: Response) => {
  const token = req.body.token || req.headers.authorization?.split(' ')[1];

  if (!token) {
    throw new UnauthorizedException('Token required in body ({ token }) or Authorization Bearer header');
  }

  const decoded = authService.validateToken(token);

  return res.status(200).json({
    status: 'ok',
    valid: true,
    payload: decoded,
    accessSummary: {
      hasAdminAccess: decoded.admin === true,
      role: decoded.role,
      subjectId: decoded.sub,
      permissions: decoded.permissions,
    },
  });
});

/**
 * POST /api/v1/auth/change-password
 * Updates the user's password securely
 */
export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new UnauthorizedException('Authentication required');
  }

  const { currentPassword, newPassword } = req.body;
  await authService.changePassword(req.user.sub, currentPassword, newPassword);

  return res.status(200).json({
    status: 'ok',
    message: 'Password updated successfully',
  });
});

/**
 * PATCH /api/v1/auth/users/:id/labs
 * Updates assigned laboratory room scopes for a user
 * Supported for Administrators (universal) and Faculty Lecturers (for supervising Lab Assistants within their managed rooms)
 */
export const updateAssignedLabs = asyncHandler(async (req: Request, res: Response) => {
  const userId = String(req.params.id);
  const { assignedLabs } = req.body;

  if (!Array.isArray(assignedLabs)) {
    return res.status(400).json({
      status: 'error',
      message: 'assignedLabs must be an array of room codes e.g. ["Room 102B", "Room 206"] or ["all"]',
    });
  }

  await authService.updateAssignedLabs(userId, assignedLabs, req.user);

  return res.status(200).json({
    status: 'ok',
    message: 'User laboratory scopes updated successfully',
    data: {
      userId,
      assignedLabs,
    },
  });
});

/**
 * GET /api/v1/auth/users
 * Lists all registered users (Excludes password hashes)
 */
export const listUsers = asyncHandler(async (req: Request, res: Response) => {
  const users = await authService.getAllUsers();

  return res.status(200).json({
    status: 'ok',
    count: users.length,
    users,
  });
});

/**
 * PATCH /api/v1/auth/users/:id/role
 * Updates role and administrative authorization for a user (Admin only)
 */
export const updateUserRole = asyncHandler(async (req: Request, res: Response) => {
  const userId = String(req.params.id);
  const { role } = req.body;

  if (!role || typeof role !== 'string') {
    return res.status(400).json({
      status: 'error',
      message: 'role string is required in request body',
    });
  }

  await authService.updateUserRole(userId, role, req.user?.sub);

  return res.status(200).json({
    status: 'ok',
    message: `User role successfully updated to ${role}`,
    data: {
      userId,
      role,
    },
  });
});

/**
 * DELETE /api/v1/auth/users/:id
 * Removes a user account (Admin only, cannot delete oneself)
 */
export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const userId = String(req.params.id);

  await authService.deleteUser(userId, req.user?.sub);

  return res.status(200).json({
    status: 'ok',
    message: 'User account successfully deleted',
    data: {
      userId,
    },
  });
});
