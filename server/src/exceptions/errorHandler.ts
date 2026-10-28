import { Request, Response, NextFunction } from 'express';

/**
 * Base Application Exception for operational errors
 */
export class AppException extends Error {
  public statusCode: number;
  public errorCode: string;
  public isOperational: boolean;
  public details?: any;

  constructor(message: string, statusCode = 500, errorCode = 'INTERNAL_ERROR', details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationException extends AppException {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class UnauthorizedException extends AppException {
  constructor(
    message = 'Unauthorized access. Valid authentication token required.',
    errorCode = 'UNAUTHORIZED',
    details?: any
  ) {
    super(message, 401, errorCode, details);
  }
}

export class ForbiddenException extends AppException {
  constructor(
    message = 'Access forbidden. You do not have sufficient permissions.',
    errorCode = 'FORBIDDEN',
    details?: any
  ) {
    super(message, 403, errorCode, details);
  }
}

export class NotFoundException extends AppException {
  constructor(resource = 'Resource', details?: any) {
    super(`${resource} not found`, 404, 'NOT_FOUND', details);
  }
}

export class ConflictException extends AppException {
  constructor(message: string, details?: any) {
    super(message, 409, 'CONFLICT', details);
  }
}

export class DatabaseException extends AppException {
  constructor(message = 'Database operation failed', details?: any) {
    super(message, 500, 'DATABASE_ERROR', details);
  }
}

/**
 * Async handler wrapper to catch and forward errors to centralized error middleware
 */
export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Production-ready centralized error handler middleware
 */
export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  // Normalize status and error code
  const statusCode = err.statusCode || 500;
  const isOperational = err.isOperational || false;
  const errorCode = err.errorCode || 'INTERNAL_ERROR';

  // Handle JWT specific errors
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      status: 'error',
      code: 'TOKEN_EXPIRED',
      message: 'Authentication token has expired. Please sign in again.',
    });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      status: 'error',
      code: 'INVALID_TOKEN',
      message: 'Invalid cryptographic authentication token.',
    });
  }

  // Handle body-parser JSON syntax error
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({
      status: 'error',
      code: 'MALFORMED_JSON',
      message: 'Malformed JSON payload in request body.',
    });
  }

  // In production, do not leak unexpected internal system errors to client
  const isProduction = process.env.NODE_ENV === 'production';
  const responseMessage =
    isOperational || !isProduction
      ? err.message
      : 'An unexpected internal server error occurred.';

  // Log non-operational errors for observability
  if (!isOperational) {
    console.error('💥 [CRITICAL SERVER ERROR]:', err);
  }

  // Protect against information disclosure: only expose field validation details in production
  const safeDetails =
    errorCode === 'VALIDATION_ERROR'
      ? err.details
      : !isProduction
      ? err.details
      : undefined;

  return res.status(statusCode).json({
    status: 'error',
    code: errorCode,
    message: responseMessage,
    ...(safeDetails && { details: safeDetails }),
    ...(!isProduction && { stack: err.stack }),
  });
}
