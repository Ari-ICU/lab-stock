import express, { Application, Request, Response } from 'express';
import routes from './routes/index.js';
import { requestLogger } from './utils/requestLogger.js';
import {
  helmetSecurity,
  corsSecurity,
  globalRateLimiter,
  sanitizeRequest,
} from './middleware/security.js';
import { errorHandler } from './middleware/errorHandler.js';

const app: Application = express();

// Disable technology disclosure header
app.disable('x-powered-by');

// 1. Security Headers & CORS
app.use(helmetSecurity);
app.use(corsSecurity);

// 2. Rate Limiting Protection
app.use(globalRateLimiter);

// 3. UI Terminal Request Logger (from utils)
app.use(requestLogger);

// 4. Request Body Parsing with Size Guards (prevents memory overflow DoS)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 5. Input Sanitization (prototype pollution protection)
app.use(sanitizeRequest);

// 6. Silence browser favicon noise
app.get('/favicon.ico', (_req: Request, res: Response) => {
  res.status(204).end();
});

// 7. Root Information Route
app.get('/', (_req: Request, res: Response) => {
  res.json({
    name: 'Lab Stock Management API',
    status: 'online',
    version: '1.0.0',
    endpoints: {
      health: '/api/v1/health',
    },
    security: {
      helmet: 'enabled',
      rateLimit: 'enabled',
      cors: 'enabled',
      sanitization: 'enabled',
    },
  });
});

// 8. API Routes
app.use('/api/v1', routes);

// 9. 404 Route Handler for undefined endpoints
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    status: 'error',
    message: 'Endpoint not found',
  });
});

// 10. Global Error Handler
app.use(errorHandler);

export default app;
