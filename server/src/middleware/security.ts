import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import { Request, Response, NextFunction } from 'express';
import { config } from '@/config/index.js';
import { AppException } from '@/exceptions/errorHandler.js';

// ========================================================
// 1. CORS CONFIGURATION (Strict in Production)
// ========================================================
export const corsSecurity = cors({
  origin: (origin, callback) => {
    const isProduction = config.nodeEnv === 'production';
    const extraOrigins = (config.clientUrl || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    const allowedOrigins = [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3001',
      'http://localhost:5001',
      ...extraOrigins,
    ];

    // Allow requests with no origin (mobile apps, server-to-server curl, Postman)
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    if (isProduction) {
      return callback(new AppException(`CORS blocked: Origin is not authorized`, 403, 'CORS_BLOCKED'));
    }

    // Permissive during local development only
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  maxAge: 86400, // 24 hours pre-flight caching
});

// ========================================================
// 2. HELMET SECURITY HEADERS
// ========================================================
export const helmetSecurity = helmet({
  // Relaxed specifically so Swagger UI scripts & CSS render properly
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  frameguard: { action: 'deny' }, // Clickjacking protection (X-Frame-Options: DENY)
  noSniff: true,                  // MIME-type sniffing protection (X-Content-Type-Options: nosniff)
  hsts: {
    maxAge: 31536000,             // 1 year HSTS
    includeSubDomains: true,
    preload: true,
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
});

// ========================================================
// 3. RATE LIMITING PROTECTION (Anti-DoS & Anti-Brute-Force)
// ========================================================
export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: config.nodeEnv === 'production' ? 600 : 1200, // Smooth multi-user allowance while preventing DoS
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/api/v1/health',
  message: {
    status: 'error',
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests from this client IP. Please try again after 15 minutes.',
  },
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 10,                   // Max 10 failed authentication attempts per window
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    code: 'AUTH_RATE_LIMIT_EXCEEDED',
    message: 'Too many authentication attempts. Please try again later.',
  },
});

// ========================================================
// 4. SANITIZATION: PROTOTYPE POLLUTION & XSS NEUTRALIZATION
// ========================================================
const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
const PASSWORD_KEYS = new Set(['password', 'currentPassword', 'newPassword']);
const SAFE_RASTER_DATA_URI_REGEX = /^data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=\s]+$/i;
const SCRIPT_TAG_REGEX = /<script\b[\s\S]*?>[\s\S]*?<\/script\b[^>]*>|<\/?script\b[^>]*>/gi;
const EVENT_HANDLER_REGEX = /(^|[\s"'`<;/])on[a-z]+\s*=/gi;
const DANGEROUS_URI_REGEX = /(javascript|vbscript)\s*:|data\s*:\s*(text\/html|image\/svg\+xml)/gi;

function sanitizeValue(val: any, keyName?: string): any {
  if (typeof val === 'string') {
    // Do not mutate passwords or valid raster base64 image payloads
    if ((keyName && PASSWORD_KEYS.has(keyName)) || SAFE_RASTER_DATA_URI_REGEX.test(val.trim())) {
      return val;
    }

    // Iteratively strip malicious tags, inline event handlers, and executable URI schemes
    let cleaned = val;
    let prev = '';
    while (cleaned !== prev) {
      prev = cleaned;
      cleaned = cleaned
        .replace(SCRIPT_TAG_REGEX, '')
        .replace(EVENT_HANDLER_REGEX, '$1')
        .replace(DANGEROUS_URI_REGEX, '');
    }
    return cleaned.trim();
  }

  if (Array.isArray(val)) {
    return val.map((item) => sanitizeValue(item));
  }

  if (val && typeof val === 'object') {
    for (const key of Object.keys(val)) {
      if (DANGEROUS_KEYS.has(key)) {
        delete val[key];
      } else {
        val[key] = sanitizeValue(val[key], key);
      }
    }
  }

  return val;
}

/**
 * Middleware: Cleans incoming request payloads against Prototype Pollution and Stored XSS
 */
export function sanitizeRequest(req: Request, _res: Response, next: NextFunction) {
  if (req.body) req.body = sanitizeValue(req.body);
  if (req.params) req.params = sanitizeValue(req.params);
  if (req.query) req.query = sanitizeValue(req.query);

  next();
}
