import { Router } from 'express';
import {
  getMaintenanceRecords,
  getMaintenanceById,
  createMaintenanceRecord,
  updateMaintenanceRecord,
  deleteMaintenanceRecord,
} from '@/controllers/maintenanceController.js';
import { authenticate } from '@/middleware/auth.js';

const router = Router();

// Apply authentication
router.use(authenticate);

router.get('/', getMaintenanceRecords);
router.get('/:id', getMaintenanceById);
router.post('/', createMaintenanceRecord);
router.put('/:id', updateMaintenanceRecord);
router.delete('/:id', deleteMaintenanceRecord);

export default router;

