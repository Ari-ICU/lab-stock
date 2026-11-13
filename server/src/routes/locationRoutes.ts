import { Router } from 'express';
import {
  getLocations,
  getLocationById,
  createLocation,
  updateLocation,
  deleteLocation,
  addRoomInventory,
  updateRoomInventoryCount,
  updateRoomInventoryItem,
  deleteRoomInventory,
  markRoomAudited,
} from '@/controllers/locationController.js';
import { authenticate, requirePermission, requireAdmin, requireLocationScope } from '@/middleware/auth.js';
import {
  validateCreateLocation,
  validateUpdateLocation,
  validateAddRoomInventory,
  validateUpdateRoomInventory,
  validateAdjustRoomInventoryCount,
} from '@/middleware/validate.js';
import { Permission } from '@/constants/permissions.js';
import { locationService } from '@/services/locationService.js';
import { locationModel } from '@/models/locationModel.js';
import { NotFoundException } from '@/exceptions/errorHandler.js';

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
  validateUpdateLocation,
  requireLocationScope(async (req) => {
    const loc = await locationService.getById(String(req.params.id));
    return [loc?.room, loc?.name].filter(Boolean).join(' ');
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

async function resolveInventoryItemRoom(itemId: string): Promise<string> {
  const room = await locationModel.findRoomByInventoryItemId(itemId);
  if (!room) {
    throw new NotFoundException(`Room inventory item ${itemId}`);
  }
  return [room.room, room.name].filter(Boolean).join(' ');
}

/**
 * @route   POST /api/v1/locations/:id/inventory
 * @desc    Add facility inventory item to room
 */
router.post(
  '/:id/inventory',
  requirePermission(Permission.LOCATION_MANAGE),
  validateAddRoomInventory,
  requireLocationScope(async (req) => {
    const loc = await locationService.getById(String(req.params.id));
    return [loc?.room, loc?.name].filter(Boolean).join(' ');
  }),
  addRoomInventory
);

/**
 * @route   PATCH /api/v1/locations/inventory/:itemId
 * @desc    Update count of a room inventory item
 */
router.patch(
  '/inventory/:itemId',
  requirePermission(Permission.LOCATION_MANAGE),
  validateAdjustRoomInventoryCount,
  requireLocationScope(async (req) => resolveInventoryItemRoom(String(req.params.itemId))),
  updateRoomInventoryCount
);

/**
 * @route   PUT /api/v1/locations/inventory/:itemId
 * @desc    Update room inventory item details, status, counts, remarks
 */
router.put(
  '/inventory/:itemId',
  requirePermission(Permission.LOCATION_MANAGE),
  validateUpdateRoomInventory,
  requireLocationScope(async (req) => resolveInventoryItemRoom(String(req.params.itemId))),
  updateRoomInventoryItem
);

/**
 * @route   DELETE /api/v1/locations/inventory/:itemId
 * @desc    Remove an item from room inventory
 */
router.delete(
  '/inventory/:itemId',
  requirePermission(Permission.LOCATION_MANAGE),
  requireLocationScope(async (req) => resolveInventoryItemRoom(String(req.params.itemId))),
  deleteRoomInventory
);

/**
 * @route   POST /api/v1/locations/:id/audit
 * @desc    Mark room audited
 */
router.post(
  '/:id/audit',
  requirePermission(Permission.LOCATION_MANAGE),
  requireLocationScope(async (req) => {
    const loc = await locationService.getById(String(req.params.id));
    return [loc?.room, loc?.name].filter(Boolean).join(' ');
  }),
  markRoomAudited
);

export default router;
