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
export function getOptimizedImageUrl(
  url?: string | null,
  size: ImageSizeVariant = 'thumb'
): string {
  if (!url) return '';

  // Skip data URLs, blob URLs, or local static files
  if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('/')) {
    return url;
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

