import { Router, Request, Response } from 'express';
import authRoutes from '@/routes/authRoutes.js';
import stockRoutes from '@/routes/stockRoutes.js';
import assetRoutes from '@/routes/assetRoutes.js';
import loanRoutes from '@/routes/loanRoutes.js';
import locationRoutes from '@/routes/locationRoutes.js';
import maintenanceRoutes from '@/routes/maintenanceRoutes.js';
import purchaseRequestRoutes from '@/routes/purchaseRequestRoutes.js';

const router = Router();

// Health check endpoint
router.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    message: 'Lab Stock API Gateway is healthy',
    timestamp: new Date().toISOString(),
  });
});

// Authentication & Permissions
router.use('/auth', authRoutes);

// Consumables & Stock Inventory
router.use('/stock', stockRoutes);

// Hardware Equipment & Assets
router.use('/assets', assetRoutes);

// Equipment Check-outs & Loans
router.use('/loans', loanRoutes);

// Laboratory Locations & Rooms
router.use('/locations', locationRoutes);

// Maintenance & Audits
router.use('/maintenance', maintenanceRoutes);

// Purchase Requests & Procurement
router.use('/requests', purchaseRequestRoutes);

export default router;
