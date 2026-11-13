import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../config/index.js';
import { UnauthorizedException } from '../exceptions/errorHandler.js';
import { Role } from '../constants/permissions.js';

export interface JwtUserPayload {
  sub: string;
  name: string;
  email: string;
  admin: boolean;
  role: string;
  permissions: string[];
  department?: string;
  assignedLabs?: string[];
  iat?: number;
  exp?: number;
}

/**
 * Helper: Normalizes admin detection across tokens with varying payload formats
 * (e.g. { admin: true }, { role: 'admin' }, { is_admin: true }, { role: 'Primary Lab Administrator' })
 */
export function extractIsAdmin(payload: any): boolean {
  if (!payload || typeof payload !== 'object') return false;

  if (payload.admin === true || payload.admin === 'true') return true;
  if (payload.is_admin === true || payload.is_admin === 'true') return true;

  const roleStr = String(payload.role || '').trim().toLowerCase();
  if (roleStr === 'admin' || roleStr === 'primary lab administrator') return true;

  if (Array.isArray(payload.permissions)) {
    if (payload.permissions.includes('*') || payload.permissions.includes('ALL')) {
      return true;
    }
  }

  return false;
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
    ...options,
  };

  return jwt.sign(payload, config.jwtSecret, signOptions);
}

/**
 * Cryptographically verify JWT signature and claims against configured HS256 secret.
 */
export function verifyToken(token: string): JwtUserPayload {
  if (!token || typeof token !== 'string') {
    throw new UnauthorizedException('Authentication token is required');
  }

  const cleanToken = token.trim();
  if (!cleanToken) {
    throw new UnauthorizedException('Authentication token is required');
  }

  let decoded: any;
  try {
    decoded = jwt.verify(cleanToken, config.jwtSecret, {
      algorithms: ['HS256'],
    });
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      throw new UnauthorizedException(
        'Authentication token has expired. Please log in again.',
        'TOKEN_EXPIRED'
      );
    }
    throw new UnauthorizedException(
      'Invalid or expired authentication token.',
      'INVALID_TOKEN'
    );
  }

  const sub = decoded?.sub || decoded?.id;
  if (!sub || typeof sub !== 'string') {
    throw new UnauthorizedException('Authentication token missing subject claim.', 'INVALID_TOKEN');
  }

  const isAdmin = extractIsAdmin(decoded);
  const assignedLabs = Array.isArray(decoded.assignedLabs)
    ? decoded.assignedLabs.filter((lab: unknown): lab is string => typeof lab === 'string' && lab.trim().length > 0)
    : undefined;

  return {
    sub,
    name: typeof decoded.name === 'string' && decoded.name.trim() ? decoded.name.trim() : 'Authenticated User',
    email: typeof decoded.email === 'string' ? decoded.email.trim().toLowerCase() : '',
    admin: isAdmin,
    role: isAdmin ? Role.ADMIN : decoded.role || Role.LECTURER,
    permissions:
      Array.isArray(decoded.permissions) && decoded.permissions.length > 0
        ? decoded.permissions
        : isAdmin
        ? ['*']
        : ['read'],
    department: typeof decoded.department === 'string' ? decoded.department : undefined,
    assignedLabs,
    iat: decoded.iat,
    exp: decoded.exp,
  };
}
