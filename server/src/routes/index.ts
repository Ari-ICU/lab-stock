import { Router, Request, Response } from 'express';
import authRoutes from '@/routes/authRoutes.js';
import stockRoutes from '@/routes/stockRoutes.js';
import assetRoutes from '@/routes/assetRoutes.js';
import loanRoutes from '@/routes/loanRoutes.js';
import locationRoutes from '@/routes/locationRoutes.js';
import transferRoutes from '@/routes/transferRoutes.js';
import categoryRoutes from '@/routes/categoryRoutes.js';

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

// Inventory Categories
router.use('/categories', categoryRoutes);

// Hardware Equipment & Assets
router.use('/assets', assetRoutes);

// Equipment Check-outs & Loans
router.use('/loans', loanRoutes);

// Laboratory Locations & Rooms
router.use('/locations', locationRoutes);

// Equipment Relocations & Transfers
router.use('/transfers', transferRoutes);

export default router;
