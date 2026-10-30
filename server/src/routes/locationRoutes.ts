import { Router } from 'express';
import {
  getLocations,
  getLocationById,
  createLocation,
  updateLocation,
  deleteLocation,
  addRoomInventory,
  updateRoomInventoryCount,
  deleteRoomInventory,
  markRoomAudited,
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

/**
 * @route   POST /api/v1/locations/:id/inventory
 * @desc    Add facility inventory item to room
 */
router.post(
  '/:id/inventory',
  requirePermission(Permission.LOCATION_MANAGE),
  addRoomInventory
);

/**
 * @route   PATCH /api/v1/locations/inventory/:itemId
 * @desc    Update count of a room inventory item
 */
router.patch(
  '/inventory/:itemId',
  requirePermission(Permission.LOCATION_MANAGE),
  updateRoomInventoryCount
);

/**
 * @route   DELETE /api/v1/locations/inventory/:itemId
 * @desc    Remove an item from room inventory
 */
router.delete(
  '/inventory/:itemId',
  requirePermission(Permission.LOCATION_MANAGE),
  deleteRoomInventory
);

/**
 * @route   POST /api/v1/locations/:id/audit
 * @desc    Mark room audited
 */
router.post(
  '/:id/audit',
  requirePermission(Permission.LOCATION_MANAGE),
  markRoomAudited
);

export default router;
