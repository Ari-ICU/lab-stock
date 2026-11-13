/**
 * Image optimization utilities for the CSD Lab Stock management platform.
 * 
 * Prevents high latency and excessive bandwidth consumption in production
 * by resizing remote images (such as Unsplash CDN mock assets) according to
 * their display context (table thumbnails, cards, or hero views).
 */

export type ImageSizeVariant = 'thumb' | 'card' | 'full';

/**
 * Returns an optimized image URL for fast loading over network connections.
 * 
 * - 'thumb' (40px - 64px tables/lists): ~120px width @ 65% quality (~5KB - 8KB vs 250KB)
 * - 'card' (150px - 300px grid cards): ~480px width @ 75% quality (~25KB - 40KB)
 * - 'full' (Hero detail views): ~960px width @ 80% quality (~80KB - 120KB)
 */
const ALLOWED_RASTER_DATA_URI = /^data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=]+$/i;

/**
 * Validates that an image URL uses a safe scheme (https/http, local path,
 * safe blob URL, or raster image data URI) and blocks SVG/script payloads.
 */
export function isSafeImageUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed) return false;

  if (trimmed.startsWith('/')) {
    return !trimmed.startsWith('//') && !trimmed.startsWith('/\\');
  }

  if (/^data:/i.test(trimmed)) {
    return ALLOWED_RASTER_DATA_URI.test(trimmed);
  }

  if (/^blob:/i.test(trimmed)) {
    try {
      const inner = new URL(trimmed.slice(5));
      return inner.protocol === 'https:' || inner.protocol === 'http:';
    } catch {
      return false;
    }
  }

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export function getOptimizedImageUrl(
  url?: string | null,
  size: ImageSizeVariant = 'thumb'
): string {
  if (!url || !isSafeImageUrl(url)) return '';
  const trimmed = url.trim();

  // Skip data URLs, blob URLs, or local static files
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:') || trimmed.startsWith('/')) {
    return trimmed;
  }

  // Optimize Unsplash CDN images
  if (url.includes('images.unsplash.com')) {
    try {
      const parsed = new URL(url);
      const width = size === 'thumb' ? 120 : size === 'card' ? 480 : 960;
      const quality = size === 'thumb' ? 65 : size === 'card' ? 75 : 80;

      parsed.searchParams.set('w', String(width));
      parsed.searchParams.set('q', String(quality));
      parsed.searchParams.set('auto', 'format');
      parsed.searchParams.set('fit', 'crop');

      return parsed.toString();
    } catch {
      return url;
    }
  }

  return url;
}

