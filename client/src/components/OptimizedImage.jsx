import React from 'react';
import fallbackImage from '../assets/images/TeaHouseLogo.webp';

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  eager = false,
  sizes = '(max-width: 800px) 100vw, 50vw',
  className,
  onMissing,
}) {
  return (
    <img
      className={`optimized-image ${className || ''}`.trim()}
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading={eager ? 'eager' : 'lazy'}
      fetchPriority={eager ? 'high' : 'auto'}
      decoding="async"
      sizes={sizes}
      onError={(event) => {
        const image = event.currentTarget;
        image.onerror = null;
        if (onMissing) {
          onMissing();
          return;
        }
        image.src = fallbackImage;
        image.classList.add('is-missing');
      }}
    />
  );
}
