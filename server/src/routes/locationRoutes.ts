import { Router } from 'express';
import {
  getLocations,
  getLocationById,
  createLocation,
} from '@/controllers/locationController.js';
import { authenticate, requirePermission } from '@/middleware/auth.js';
import { validateCreateLocation } from '@/middleware/validate.js';
import { Permission } from '@/constants/permissions.js';

const router = Router();

// Apply authentication to all location routes
router.use(authenticate);

/**
 * @route   GET /api/v1/locations
 * @desc    Get all lab locations & facilities
 * @access  Protected (Requires locations:read)
 */
router.get('/', requirePermission(Permission.LOCATION_READ), getLocations);

/**
 * @route   GET /api/v1/locations/:id
 * @desc    Get single lab location by ID
 * @access  Protected (Requires locations:read)
 */
router.get('/:id', requirePermission(Permission.LOCATION_READ), getLocationById);

/**
 * @route   POST /api/v1/locations
 * @desc    Register a new laboratory room with DTO validation
 * @access  Protected (Requires locations:manage)
 */
router.post(
  '/',
  requirePermission(Permission.LOCATION_MANAGE),
  validateCreateLocation,
  createLocation
);

export default router;
