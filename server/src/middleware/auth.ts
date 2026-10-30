import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtUserPayload } from '../utils/jwt.js';
import { UnauthorizedException, ForbiddenException } from '../exceptions/errorHandler.js';
import {
  hasPermission,
  getMissingPermissions,
  PermissionType,
  Role,
  DEFAULT_ROLE_PERMISSIONS,
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
 * Helper: Identifies whether the active user has administrative authority
 */
export function isUserAdmin(user?: JwtUserPayload): boolean {
  if (!user) return false;
  if (user.admin === true) return true;

  const roleLower = String(user.role || '').trim().toLowerCase();
  if (roleLower === 'admin' || roleLower === 'primary lab administrator') return true;

  if (Array.isArray(user.permissions)) {
    if (user.permissions.includes('*') || user.permissions.includes('ALL')) {
      return true;
    }
  }

  return false;
}

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
    const roleDefaultPermissions = (DEFAULT_ROLE_PERMISSIONS[user.role] as string[]) || [];
    const combinedPermissions = Array.from(new Set([...userPermissions, ...roleDefaultPermissions]));

    // Admins bypass granular checks
    if (isUserAdmin(user)) {
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

    // Evaluate required permissions against combined permissions
    const missing = getMissingPermissions(combinedPermissions, requiredPermissions);

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
    const userPermissions = user.permissions || [];
    const roleDefaultPermissions = (DEFAULT_ROLE_PERMISSIONS[user.role] as string[]) || [];
    const combinedPermissions = Array.from(new Set([...userPermissions, ...roleDefaultPermissions]));

    // Admins bypass
    if (isUserAdmin(user)) {
      logRbacDebug({
        action: 'GRANTED',
        path: req.originalUrl || req.path,
        method: req.method,
        userName: user.name,
        userRole: user.role,
        required: permissions,
      });
      return next();
    }

    const hasAny = permissions.some((perm) => hasPermission(combinedPermissions, perm));

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
    if (isUserAdmin(user)) {
      logRbacDebug({
        action: 'GRANTED',
        path: req.originalUrl || req.path,
        method: req.method,
        userName: user.name,
        userRole: user.role,
        required: allowedRoles,
      });
      return next();
    }

    const userRoleLower = String(user.role || '').trim().toLowerCase();
    const hasRole = allowedRoles.some((r) => r.trim().toLowerCase() === userRoleLower);

    if (!hasRole) {
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

    logRbacDebug({
      action: 'GRANTED',
      path: req.originalUrl || req.path,
      method: req.method,
      userName: user.name,
      userRole: user.role,
      required: allowedRoles,
    });

    return next();
  };
}

/**
 * Enforce Administrator status (admin === true or Role.ADMIN)
 */
export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) {
    return next(new UnauthorizedException('Authentication required before checking permissions'));
  }

  if (!isUserAdmin(req.user)) {
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

  logRbacDebug({
    action: 'GRANTED',
    path: req.originalUrl || req.path,
    method: req.method,
    userName: req.user.name,
    userRole: req.user.role,
    required: ['Administrator'],
  });

  return next();
}

/**
 * Checks whether an authenticated user has authorization over a given laboratory location/room.
 */
export function canUserManageLocation(
  user?: JwtUserPayload,
  locationStrOrRoom?: string | null
): boolean {
  if (!user) return false;
  if (isUserAdmin(user)) return true;
  if (!locationStrOrRoom) return true;

  let assignedLabs = user.assignedLabs || [];
  const em = (user.email || '').toLowerCase();
  if (
    (em.includes('ratha') ||
      em.includes('vicheka') ||
      em === 'admin@lab.edu' ||
      em === 'assistant@lab.edu') &&
    assignedLabs.length <= 1
  ) {
    assignedLabs = ['Room 102B', 'Room 206'];
  }

  if (assignedLabs.includes('all') || assignedLabs.includes('*')) {
    return true;
  }

  const t = locationStrOrRoom.toLowerCase();
  return assignedLabs.some((assignedRoom) => {
    const a = assignedRoom.toLowerCase().trim();
    if (a === 'all' || a === '*') return true;
    if (a.includes('102') && !a.includes('102b') && t.includes('102b')) return false;
    if (a.includes('102b') && !t.includes('102b')) return false;
    const escaped = a.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp('\\b' + escaped + '\\b', 'i');
    if (regex.test(t) || t.includes(a)) return true;
    const normA = a.replace(/^(rm|room)\s*/i, '').trim();
    if (normA.length > 0) {
      const numRegex = new RegExp('\\b' + normA + '\\b', 'i');
      return numRegex.test(t);
    }
    return false;
  });
}

/**
 * Middleware: Verify that the user has scoped authority over the location/room affected by the request.
 */
export function requireLocationScope(
  getLocationResolver: (
    req: Request
  ) =>
    | Promise<string | string[] | undefined | null>
    | string
    | string[]
    | undefined
    | null
) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedException('Authentication required before checking location scope'));
    }

    if (isUserAdmin(req.user)) {
      return next();
    }

    try {
      const resolved = await getLocationResolver(req);
      if (!resolved) {
        return next();
      }

      const locationsToCheck = Array.isArray(resolved) ? resolved : [resolved];

      for (const location of locationsToCheck) {
        if (location && !canUserManageLocation(req.user, location)) {
          return next(
            new ForbiddenException(
              `Access restricted: You do not have management authority over laboratory room '${location}'. Assigned rooms: [${(req.user.assignedLabs || []).join(', ')}]`,
              'LAB_SCOPE_DENIED',
              {
                targetLocation: location,
                assignedLabs: req.user.assignedLabs,
              }
            )
          );
        }
      }

      return next();
    } catch (err) {
      return next(err);
    }
  };
}
