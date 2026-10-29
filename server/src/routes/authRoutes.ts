import { Router, Request, Response } from 'express';
import {
  login,
  register,
  getProfile,
  verifyTokenEndpoint,
  changePassword,
  updateAssignedLabs,
  listUsers,
  updateUserRole,
  deleteUser,
} from '@/controllers/authController.js';
import {
  authenticate,
  requireAdmin,
  requireRole,
  requirePermission,
  requireAnyPermission,
} from '@/middleware/auth.js';
import { authRateLimiter } from '@/middleware/security.js';
import {
  validateLogin,
  validateRegister,
  validatePasswordChange,
} from '@/middleware/validate.js';
import { Permission, Role } from '@/constants/permissions.js';

const router = Router();

/**
 * @route   POST /api/v1/auth/login
 * @desc    Authenticate credentials against PostgreSQL and return JWT
 * @access  Public (Brute-force rate limited)
 */
router.post('/login', authRateLimiter, validateLogin, login);

/**
 * @route   POST /api/v1/auth/register
 * @desc    Provision a new faculty or admin account
 * @access  Protected (Requires Administrator)
 */
router.post('/register', authenticate, requireAdmin, validateRegister, register);

/**
 * @route   POST /api/v1/auth/verify
 * @desc    Cryptographically verify token signature and inspect claims
 * @access  Public
 */
router.post('/verify', verifyTokenEndpoint);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Retrieve active session user profile
 * @access  Protected (Requires Valid JWT)
 */
router.get('/me', authenticate, getProfile);

/**
 * @route   POST /api/v1/auth/change-password
 * @desc    Update authenticated user password
 * @access  Protected (Requires Valid JWT)
 */
router.post('/change-password', authenticate, validatePasswordChange, changePassword);

/**
 * @route   PATCH /api/v1/auth/users/:id/labs
 * @desc    Assign or update laboratory rooms scope for an operator
 * @access  Protected (Administrator only)
 */
router.patch('/users/:id/labs', authenticate, requireAdmin, updateAssignedLabs);

/**
 * @route   GET /api/v1/auth/users
 * @desc    List all system users
 * @access  Protected (Authenticated users)
 */
router.get('/users', authenticate, listUsers);

/**
 * @route   PATCH /api/v1/auth/users/:id/role
 * @desc    Update role and admin authorization for a user
 * @access  Protected (Administrator only)
 */
router.patch('/users/:id/role', authenticate, requireAdmin, updateUserRole);

/**
 * @route   DELETE /api/v1/auth/users/:id
 * @desc    Remove a user account (Cannot remove oneself)
 * @access  Protected (Administrator only)
 */
router.delete('/users/:id', authenticate, requireAdmin, deleteUser);

/**
 * @route   GET /api/v1/auth/admin-only
 * @desc    Gate check for Administrator permissions
 * @access  Protected (Administrator only)
 */
router.get('/admin-only', authenticate, requireAdmin, (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    message: 'Access Granted: Welcome to the Lab Administrator zone!',
    adminUser: req.user,
    timestamp: new Date().toISOString(),
  });
});

/**
 * @route   GET /api/v1/auth/faculty-only
 * @desc    Gate check for Faculty Lecturer or Admin roles
 * @access  Protected (Faculty Lecturer or Administrator)
 */
router.get(
  '/faculty-only',
  authenticate,
  requireRole(Role.LECTURER, Role.ADMIN),
  (req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      message: 'Access Granted: Faculty Course and Device Allocation Area',
      user: req.user,
    });
  }
);

/**
 * @route   GET /api/v1/auth/permission-test
 * @desc    Demonstrates granular RBAC requiring inventory write permissions
 * @access  Protected (Requires stock:create)
 */
router.get(
  '/permission-test',
  authenticate,
  requirePermission(Permission.STOCK_CREATE),
  (req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      message: 'Access Granted: Verified permission stock:create',
      user: req.user,
    });
  }
);

export default router;
