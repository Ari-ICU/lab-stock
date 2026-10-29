import { Router } from 'express';
import {
  getLocations,
  getLocationById,
  createLocation,
  updateLocation,
  deleteLocation,
} from '@/controllers/locationController.js';
import { authenticate, requirePermission, requireAdmin, requireLocationScope } from '@/middleware/auth.js';
import { validateCreateLocation } from '@/middleware/validate.js';
import { Permission } from '@/constants/permissions.js';
import { locationService } from '@/services/locationService.js';

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
 * @desc    Register a new laboratory room (Administrators only)
 * @access  Protected (Admin Required)
 */
router.post(
  '/',
  requireAdmin,
  validateCreateLocation,
  createLocation
);

/**
 * @route   PUT /api/v1/locations/:id
 * @desc    Update an existing laboratory room parameters (Assigned Operator or Admin)
 * @access  Protected (Locations Manage + Room Scope)
 */
router.put(
  '/:id',
  requirePermission(Permission.LOCATION_MANAGE),
  requireLocationScope(async (req) => {
    const loc = await locationService.getById(String(req.params.id));
    return loc?.room || loc?.name;
  }),
  updateLocation
);

/**
 * @route   DELETE /api/v1/locations/:id
 * @desc    Delete a laboratory room (Administrators only)
 * @access  Protected (Admin Required)
 */
router.delete(
  '/:id',
  requireAdmin,
  deleteLocation
);

export default router;
