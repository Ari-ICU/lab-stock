import { Router, Request, Response } from 'express';
import authRoutes from './authRoutes.js';
import stockRoutes from './stockRoutes.js';
import assetRoutes from './assetRoutes.js';
import loanRoutes from './loanRoutes.js';
import locationRoutes from './locationRoutes.js';

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

export default router;
