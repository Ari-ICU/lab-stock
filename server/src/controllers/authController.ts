import { Request, Response } from 'express';
import { authService } from '../services/authService.js';
import { asyncHandler, UnauthorizedException } from '../exceptions/errorHandler.js';

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
 */
export const register = asyncHandler(async (req: Request, res: Response) => {
  const newUser = await authService.register(req.body);

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

  const user = await authService.getUserProfile(req.user.sub);

  return res.status(200).json({
    status: 'ok',
    user,
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
