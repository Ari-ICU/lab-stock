import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../config/index.js';
import { UnauthorizedException } from '../exceptions/errorHandler.js';

export interface JwtUserPayload {
  sub: string;
  name: string;
  email: string;
  admin: boolean;
  role: string;
  permissions: string[];
  department?: string;
  iat?: number;
  exp?: number;
}

/**
 * Sign a new cryptographically secured JSON Web Token
 */
export function signToken(
  payload: Omit<JwtUserPayload, 'iat' | 'exp'>,
  options?: SignOptions
): string {
  const signOptions: SignOptions = {
    algorithm: 'HS256',
    expiresIn: (config.jwtExpiresIn as any) || '7d',
    issuer: 'lab-stock-auth-service',
    audience: 'lab-stock-platform',
    ...options,
  };

  return jwt.sign(payload, config.jwtSecret, signOptions);
}

/**
 * Cryptographically verify JWT signature, expiration, issuer, and audience
 * Throws UnauthorizedException if token is forged, tampered, or expired.
 */
export function verifyToken(token: string): JwtUserPayload {
  if (!token || typeof token !== 'string') {
    throw new UnauthorizedException('Authentication token is required');
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret, {
      algorithms: ['HS256'],
      audience: 'lab-stock-platform',
      issuer: 'lab-stock-auth-service',
    }) as any;

    if (!decoded.sub || !decoded.role) {
      throw new UnauthorizedException('Malformed token payload: missing required identity claims');
    }

    return {
      sub: decoded.sub,
      name: decoded.name || 'User',
      email: decoded.email || '',
      admin: Boolean(decoded.admin),
      role: decoded.role,
      permissions: Array.isArray(decoded.permissions) ? decoded.permissions : [],
      department: decoded.department,
      iat: decoded.iat,
      exp: decoded.exp,
    };
  } catch (err: any) {
    if (err instanceof UnauthorizedException) throw err;
    if (err.name === 'TokenExpiredError') {
      throw new UnauthorizedException('Authentication token has expired. Please log in again.', 'TOKEN_EXPIRED');
    }
    throw new UnauthorizedException('Invalid or tampered authentication token signature.', 'INVALID_TOKEN');
  }
}

/**
 * Safe decoder to inspect claims without verifying signature (for debugging or client headers inspection only)
 */
export function decodeTokenUnsafe(token: string): any {
  return jwt.decode(token);
}
