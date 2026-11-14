/**
 * Security Audit & Log Sanitization Utilities
 * Prevents CRLF log injection, redacts sensitive query parameters/tokens,
 * and masks emails in security audit logs.
 */

const CONTROL_CHARS_REGEX = /[\r\n\x00-\x1F\x7F]+/g;
const SENSITIVE_QUERY_KEYS = new Set([
  'token',
  'access_token',
  'refresh_token',
  'auth',
  'authorization',
  'password',
  'pwd',
  'secret',
  'api_key',
  'apikey',
  'key',
  'jwt',
  'code',
]);

/**
 * Strip newline / control characters to prevent log injection.
 */
export function sanitizeLogText(value: unknown, maxLen = 240): string {
  if (value === null || value === undefined) return '';
  const cleaned = String(value).replace(CONTROL_CHARS_REGEX, ' ').trim();
  return cleaned.length > maxLen ? `${cleaned.slice(0, maxLen)}…` : cleaned;
}

/**
 * Redact sensitive query parameters before logging a request URL.
 */
export function redactSensitiveUrl(rawUrl: string): string {
  const safeUrl = sanitizeLogText(rawUrl, 500);
  const qIndex = safeUrl.indexOf('?');
  if (qIndex === -1) return safeUrl;

  const basePath = safeUrl.slice(0, qIndex);
  const rawQuery = safeUrl.slice(qIndex + 1);
  try {
    const params = new URLSearchParams(rawQuery);
    for (const key of Array.from(params.keys())) {
      if (SENSITIVE_QUERY_KEYS.has(key.toLowerCase())) {
        params.set(key, '[REDACTED]');
      }
    }
    const serialized = params.toString();
    return serialized ? `${basePath}?${serialized}` : basePath;
  } catch {
    return `${basePath}?[REDACTED]`;
  }
}

/**
 * Partially mask an email address for safe audit logging (e.g. a***@domain.com).
 */
export function maskEmail(email: string): string {
  const clean = sanitizeLogText(email, 160).toLowerCase();
  const atIndex = clean.indexOf('@');
  if (atIndex <= 0) return '[redacted]';
  const local = clean.slice(0, atIndex);
  const domain = clean.slice(atIndex + 1);
  const prefix = local.slice(0, Math.min(2, local.length));
  return `${prefix}***@${domain}`;
}

export type SecurityAuditAction =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'LOGIN_BLOCKED'
  | 'PASSWORD_CHANGED'
  | 'USER_CREATED'
  | 'USER_ROLE_UPDATED'
  | 'USER_DELETED';

export function logSecurityEvent(event: {
  action: SecurityAuditAction;
  actor?: string;
  target?: string;
  ip?: string;
  reason?: string;
}): void {
  const timestamp = new Date().toISOString();
  const parts = [
    `[SECURITY:${event.action}]`,
    `time=${timestamp}`,
    event.actor ? `actor=${sanitizeLogText(event.actor, 100)}` : null,
    event.target ? `target=${sanitizeLogText(event.target, 100)}` : null,
    event.ip ? `ip=${sanitizeLogText(event.ip, 64)}` : null,
    event.reason ? `reason=${sanitizeLogText(event.reason, 120)}` : null,
  ].filter(Boolean);

  if (event.action === 'LOGIN_FAILED' || event.action === 'LOGIN_BLOCKED') {
    console.warn(parts.join(' '));
  } else {
    console.info(parts.join(' '));
  }
}
