export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const SAFE_RASTER_DATA_URI_REGEX = /^data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=\s]+$/i;

export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  return EMAIL_REGEX.test(email.trim());
}

export function isValidUuid(id: string): boolean {
  if (!id || typeof id !== 'string') return false;
  return UUID_REGEX.test(id.trim());
}

export function isValidDateFormat(dateStr: string): boolean {
  if (!dateStr || typeof dateStr !== 'string') return false;
  const trimmed = dateStr.trim();
  if (!DATE_REGEX.test(trimmed)) return false;
  const parsed = new Date(`${trimmed}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(trimmed);
}

/**
 * Validates optional image URL or raster data URI (blocks SVG XSS and javascript: URIs)
 */
export function isValidImageUrl(url: unknown): boolean {
  if (url === undefined || url === null || url === '') return true;
  if (typeof url !== 'string') return false;

  const trimmed = url.trim();
  if (!trimmed) return true;

  if (SAFE_RASTER_DATA_URI_REGEX.test(trimmed)) {
    return trimmed.length <= 4 * 1024 * 1024;
  }

  if (trimmed.startsWith('/') && !trimmed.startsWith('//') && !trimmed.includes('\\')) {
    return trimmed.length <= 2048;
  }

  try {
    const parsed = new URL(trimmed);
    return (parsed.protocol === 'https:' || parsed.protocol === 'http:') && trimmed.length <= 2048;
  } catch {
    return false;
  }
}

