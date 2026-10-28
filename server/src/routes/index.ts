import { Router, Request, Response } from 'express';

const router = Router();

// Health check endpoint
router.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    message: 'Lab Stock API Gateway is healthy',
    timestamp: new Date().toISOString(),
  });
});

export default router;

