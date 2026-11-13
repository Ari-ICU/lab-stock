import express, { Application, Request, Response, NextFunction } from 'express';
import routes from './routes/index.js';
import { requestLogger } from './utils/requestLogger.js';
import { setupSwagger } from './config/swagger.js';
import { config } from './config/index.js';
import {
  helmetSecurity,
  corsSecurity,
  globalRateLimiter,
  sanitizeRequest,
} from './middleware/security.js';
import { errorHandler } from './exceptions/errorHandler.js';

const app: Application = express();

// Trust first reverse proxy hop for accurate client IP & rate-limiting
app.set('trust proxy', 1);

// Disable technology disclosure header
app.disable('x-powered-by');

// 1. Security Headers & CORS
app.use(helmetSecurity);
app.use((req: Request, res: Response, next: NextFunction) => {
  if (!req.path.startsWith('/api/docs')) {
    res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
  }
  next();
});
app.use(corsSecurity);

// 2. Rate Limiting Protection
app.use(globalRateLimiter);

// 3. UI Terminal Request Logger (from utils)
app.use(requestLogger);

// 4. Request Body Parsing with Bounded Size Limits
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// 5. Input Sanitization (prototype pollution protection)
app.use(sanitizeRequest);

// 6. Silence browser favicon noise
app.get('/favicon.ico', (_req: Request, res: Response) => {
  res.status(204).end();
});

// 7. Interactive Swagger API Documentation (disabled in production unless explicitly enabled)
const enableSwagger = config.nodeEnv !== 'production' || process.env.ENABLE_SWAGGER === 'true';
if (enableSwagger) {
  setupSwagger(app);
}

// 8. Root Information Route
app.get('/', (_req: Request, res: Response) => {
  res.json({
    name: 'Lab Stock Management API',
    status: 'online',
    version: '1.0.0',
    endpoints: {
      health: '/api/v1/health',
      auth: '/api/v1/auth',
      ...(enableSwagger && { swagger: '/api/docs', swaggerJson: '/api/docs.json' }),
    },
  });
});

// 9. API Routes
app.use('/api/v1', routes);

// 10. 404 Route Handler for undefined endpoints
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    status: 'error',
    message: 'Endpoint not found',
  });
});

// 11. Global Error Handler
app.use(errorHandler);

export default app;
