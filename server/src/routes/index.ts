import { Router, Request, Response } from 'express';
import authRoutes from './authRoutes.js';

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

export default router;
