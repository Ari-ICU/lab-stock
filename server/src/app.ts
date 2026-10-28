import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import routes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';

const app: Application = express();

// Middlewares
app.use(morgan('dev'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root welcome route
app.get('/', (_req: Request, res: Response) => {
  res.json({
    name: 'Lab Stock Management API',
    status: 'online',
    version: '1.0.0',
    endpoints: {
      health: '/api/v1/health',
    },
  });
});

// API Routes
app.use('/api/v1', routes);

// Global Error Handler
app.use(errorHandler);

export default app;

