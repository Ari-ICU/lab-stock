import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtUserPayload } from '../utils/jwt.js';
import { UnauthorizedException, ForbiddenException } from '../exceptions/errorHandler.js';
import {
  hasPermission,
  getMissingPermissions,
  PermissionType,
  Role,
} from '../constants/permissions.js';

// Extend Express Request interface to include authenticated user & diagnostic context
declare global {
  namespace Express {
    interface Request {
      user?: JwtUserPayload;
      authDiagnostics?: {
        checkedAt: string;
        requiredPermissions?: string[];
        evaluationResult: 'GRANTED' | 'DENIED';
        reason?: string;
      };
    }
  }
}

/**
 * ANSI Color helpers for readable terminal debugging
 */
const logStyles = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

/**
 * Helper to log RBAC diagnostic events in development or when DEBUG_AUTH=true
 */
function logRbacDebug(params: {
  action: 'GRANTED' | 'DENIED';
  path: string;
  method: string;
  userName: string;
  userRole: string;
  required: string[];
  missing?: string[];
}) {
  const isDev = process.env.NODE_ENV !== 'production' || process.env.DEBUG_AUTH === 'true';
  if (!isDev) return;

  const tag =
    params.action === 'GRANTED'
      ? `${logStyles.green}🛡️ [RBAC:GRANTED]${logStyles.reset}`
      : `${logStyles.red}⛔ [RBAC:DENIED]${logStyles.reset}`;

  const route = `${logStyles.cyan}${params.method} ${params.path}${logStyles.reset}`;
  const user = `${logStyles.bold}${params.userName}${logStyles.reset} (${logStyles.yellow}${params.userRole}${logStyles.reset})`;
  const reqStr = `required: [${params.required.join(', ')}]`;
  const missStr = params.missing?.length
    ? ` ${logStyles.red}missing: [${params.missing.join(', ')}]${logStyles.reset}`
    : '';

  console.log(`${tag} ${route} │ ${user} │ ${reqStr}${missStr}`);
}

/**
 * Authentication Middleware:
 * Extracts and cryptographically verifies Bearer JWT token from the Authorization header.
 */
export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(
      new UnauthorizedException(
        'Authentication token required. Use format: Authorization: Bearer <token>',
        'TOKEN_MISSING'
      )
    );
  }

  const token = authHeader.substring(7).trim();

  if (!token) {
    return next(new UnauthorizedException('Bearer token payload cannot be empty', 'TOKEN_INVALID'));
  }

  try {
    const payload = verifyToken(token);
    req.user = payload;
    return next();
  } catch (err) {
    return next(err);
  }
}

/**
 * Require ALL specified permissions (AND logic)
 * Scalable for multi-capability routes like requiring both read and export permissions.
 */
export function requirePermission(...requiredPermissions: PermissionType[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedException('Authentication required before checking permissions'));
    }

    const user = req.user;
    const userPermissions = user.permissions || [];

    // Admins bypass granular checks
    if (user.admin === true) {
      logRbacDebug({
        action: 'GRANTED',
        path: req.originalUrl || req.path,
        method: req.method,
        userName: user.name,
        userRole: user.role,
        required: requiredPermissions,
      });
      return next();
    }

    // Evaluate required permissions against user's granted permissions
    const missing = getMissingPermissions(userPermissions, requiredPermissions);

    if (missing.length > 0) {
      logRbacDebug({
        action: 'DENIED',
        path: req.originalUrl || req.path,
        method: req.method,
        userName: user.name,
        userRole: user.role,
        required: requiredPermissions,
        missing,
      });

      return next(
        new ForbiddenException(
          `Access denied: Missing required permission(s): [${missing.join(', ')}]`,
          'PERMISSION_DENIED',
          {
            requiredPermissions,
            missingPermissions: missing,
            userRole: user.role,
            userPermissions,
          }
        )
      );
    }

    logRbacDebug({
      action: 'GRANTED',
      path: req.originalUrl || req.path,
      method: req.method,
      userName: user.name,
      userRole: user.role,
      required: requiredPermissions,
    });

    return next();
  };
}

/**
 * Require AT LEAST ONE of the specified permissions (OR logic)
 * Scalable for endpoints shared across different departmental roles.
 */
export function requireAnyPermission(...permissions: PermissionType[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedException('Authentication required'));
    }

    const user = req.user;

    // Admins bypass
    if (user.admin === true) {
      return next();
    }

    const hasAny = permissions.some((perm) => hasPermission(user.permissions || [], perm));

    if (!hasAny) {
      logRbacDebug({
        action: 'DENIED',
        path: req.originalUrl || req.path,
        method: req.method,
        userName: user.name,
        userRole: user.role,
        required: permissions,
        missing: permissions,
      });

      return next(
        new ForbiddenException(
          `Access denied: Requires at least one of [${permissions.join(', ')}]`,
          'PERMISSION_DENIED',
          {
            candidatePermissions: permissions,
            userRole: user.role,
            userPermissions: user.permissions || [],
          }
        )
      );
    }

    logRbacDebug({
      action: 'GRANTED',
      path: req.originalUrl || req.path,
      method: req.method,
      userName: user.name,
      userRole: user.role,
      required: permissions,
    });

    return next();
  };
}

/**
 * Enforce role membership (e.g. 'Primary Lab Administrator', 'Faculty Lecturer')
 */
export function requireRole(...allowedRoles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedException('Authentication required'));
    }

    const user = req.user;

    // Admin role or flag satisfies role requirements
    if (user.admin === true || user.role === Role.ADMIN) {
      return next();
    }

    if (!allowedRoles.includes(user.role)) {
      logRbacDebug({
        action: 'DENIED',
        path: req.originalUrl || req.path,
        method: req.method,
        userName: user.name,
        userRole: user.role,
        required: allowedRoles,
      });

      return next(
        new ForbiddenException(
          `Access denied: Action requires one of role(s): [${allowedRoles.join(', ')}]`,
          'ROLE_UNAUTHORIZED',
          {
            allowedRoles,
            currentUserRole: user.role,
          }
        )
      );
    }

    return next();
  };
}

/**
 * Enforce Administrator status (admin === true)
 */
export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) {
    return next(new UnauthorizedException('Authentication required before checking permissions'));
  }

  if (req.user.admin !== true && req.user.role !== Role.ADMIN) {
    logRbacDebug({
      action: 'DENIED',
      path: req.originalUrl || req.path,
      method: req.method,
      userName: req.user.name,
      userRole: req.user.role,
      required: ['Administrator'],
    });

    return next(
      new ForbiddenException('Access denied: Administrator privileges required', 'ADMIN_REQUIRED', {
        currentUserRole: req.user.role,
        adminClaim: req.user.admin,
      })
    );
  }

  return next();
}
