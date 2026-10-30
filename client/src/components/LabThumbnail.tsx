'use client';

import React, { useState, useEffect } from 'react';
import { getOptimizedImageUrl, ImageSizeVariant } from '@/lib/imageOptimization';
import { Building, Image as ImageIcon } from 'lucide-react';

interface LabThumbnailProps {
  src?: string | null;
  alt: string;
  size?: ImageSizeVariant;
  fallbackType?: 'building' | 'item';
  className?: string;
  containerClassName?: string;
  iconClassName?: string;
}

/**
 * Robust image component that prevents broken image icons or overflowing alt text.
 * Gracefully renders SVG icon fallbacks on network error, 404, or missing source.
 */
export function LabThumbnail({
  src,
  alt,
  size = 'thumb',
  fallbackType = 'item',
  className = 'w-full h-full object-cover',
  containerClassName = 'w-full h-full flex items-center justify-center',
  iconClassName,
}: LabThumbnailProps) {
  const [hasError, setHasError] = useState(false);

  // Reset error state if image source changes
  useEffect(() => {
    setHasError(false);
  }, [src]);

  if (!src || hasError) {
    return (
      <div className={containerClassName}>
        {fallbackType === 'building' ? (
          <Building className={iconClassName || 'w-6 h-6 text-emerald-700'} />
        ) : (
          <ImageIcon className={iconClassName || 'w-4 h-4 text-neutral-400'} />
        )}
      </div>
    );
  }

  return (
    <img
      src={getOptimizedImageUrl(src, size)}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setHasError(true)}
      className={className}
    />
  );
}
