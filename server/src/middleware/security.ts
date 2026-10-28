import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import { Request, Response, NextFunction } from 'express';
import { config } from '@/config/index.js';

// ========================================================
// 1. CORS CONFIGURATION (Strict in Production)
// ========================================================
export const corsSecurity = cors({
  origin: (origin, callback) => {
    const isProduction = config.nodeEnv === 'production';
    const allowedOrigins = [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:5001',
      config.clientUrl,
    ].filter(Boolean);

    // Allow requests with no origin (mobile apps, server-to-server curl, Postman)
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    if (isProduction) {
      return callback(new Error(`CORS blocked: Origin '${origin}' is not authorized`));
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
  max: 300,                  // 300 requests per IP per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests from this client IP. Please try again after 15 minutes.',
  },
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 10,                   // Max 10 authentication attempts
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    code: 'AUTH_RATE_LIMIT_EXCEEDED',
    message: 'Too many authentication attempts. IP temporarily throttled for 15 minutes.',
  },
});

// ========================================================
// 4. SANITIZATION: PROTOTYPE POLLUTION & XSS NEUTRALIZATION
// ========================================================
const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
const SCRIPT_TAG_REGEX = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
const EVENT_HANDLER_REGEX = /on\w+\s*=/gi;
const JAVASCRIPT_URL_REGEX = /javascript:/gi;

function sanitizeValue(val: any): any {
  if (typeof val === 'string') {
    // Strip malicious script tags, event handlers, and javascript: protocols
    return val
      .replace(SCRIPT_TAG_REGEX, '')
      .replace(EVENT_HANDLER_REGEX, '')
      .replace(JAVASCRIPT_URL_REGEX, '')
      .trim();
  }

  if (Array.isArray(val)) {
    return val.map(sanitizeValue);
  }

  if (val && typeof val === 'object') {
    for (const key of Object.keys(val)) {
      if (DANGEROUS_KEYS.has(key)) {
        delete val[key];
      } else {
        val[key] = sanitizeValue(val[key]);
      }
    }
  }

  return val;
}

/**
 * Middleware: Cleans incoming request payloads against Prototype Pollution and Stored XSS
 */
export function sanitizeRequest(req: Request, _res: Response, next: NextFunction) {
  if (req.body) sanitizeValue(req.body);
  if (req.params) sanitizeValue(req.params);
  if (req.query) sanitizeValue(req.query);

  next();
}
