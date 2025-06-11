type ImageFormat = 'webp' | 'jpg' | 'png' | 'avif';

interface ImageOptimizationOptions {
  width: number;
  height?: number;
  quality?: number;
  format?: ImageFormat;
}

interface ResponsiveImageSize {
  viewportWidth: number;
  width: number;
  height?: number;
}

interface ResponsiveImageOptions {
  sizes: ResponsiveImageSize[];
  quality?: number;
  formats?: ImageFormat[];
}

/**
 * Generates optimized image URLs for different devices and resolutions
 * @param src - The source URL of the image
 * @param options - Options for image optimization
 */
export function getOptimizedImage(
  src: string,
  options: ImageOptimizationOptions = { width: 800, quality: 75, format: 'webp' }
): string {
  if (!src) return '';

  // If it's an external URL or already processed, return as is
  if (
    src.startsWith('http') ||
    src.startsWith('data:') ||
    src.includes('?') ||
    src.endsWith('.svg')
  ) {
    return src;
  }

  try {
    // For local images, use Next.js image optimization
    const { width, height, quality = 75, format = 'webp' } = options;
    const params = [`w=${Math.round(width)}`];

    if (height) params.push(`h=${Math.round(height)}`);
    if (quality) params.push(`q=${Math.min(100, Math.max(1, quality))}`);
    if (format) params.push(`fm=${format}`);

    return `${src}?${params.join('&')}`;
  } catch (error) {
    console.error('Error optimizing image:', error);
    return src;
  }
}

/**
 * Generates responsive image sources for the picture element
 */
export function getResponsiveImageSources(
  src: string,
  options: ResponsiveImageOptions
): {
  src: string;
  srcSet: string;
  srcSetWebp: string;
  srcSetAvif: string;
  sizes: string;
} {
  const { sizes, quality = 75, formats = ['webp', 'jpg'] } = options;
  
  if (!sizes.length) {
    throw new Error('At least one size must be provided for responsive images');
  }

  // Sort sizes by viewport width for proper media query ordering
  const sortedSizes = [...sizes].sort((a, b) => a.viewportWidth - b.viewportWidth);
  
  const defaultSrc = getOptimizedImage(src, {
    width: sortedSizes[0].width,
    height: sortedSizes[0].height,
    quality,
    format: formats[0] as ImageFormat,
  });

  const generateSrcSet = (format: ImageFormat) =>
    sortedSizes
      .map(
        (size) =>
          `${getOptimizedImage(src, {
            width: size.width,
            height: size.height,
            quality,
            format,
          })} ${size.width}w`
      )
      .join(', ');

  const srcSet = generateSrcSet('jpg');
  const srcSetWebp = formats.includes('webp') ? generateSrcSet('webp') : '';
  const srcSetAvif = formats.includes('avif') ? generateSrcSet('avif') : '';

  const sizesAttr = sortedSizes
    .map((size) => `(max-width: ${size.viewportWidth}px) ${size.width}px`)
    .join(', ');

  return {
    src: defaultSrc,
    srcSet,
    srcSetWebp,
    srcSetAvif,
    sizes: sizesAttr,
  };
}

/**
 * Lazy loads images when they enter the viewport
 * @returns Cleanup function to remove event listeners (for non-IntersectionObserver fallback)
 */
export function lazyLoadImages(): (() => void) | void {
  if (typeof window === 'undefined') return;

  const lazyImages = Array.from(
    document.querySelectorAll<HTMLImageElement>('img[data-src]')
  );

  if (!lazyImages.length) return;

  // Use IntersectionObserver if available (modern browsers)
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          
          const img = entry.target as HTMLImageElement;
          
          // Handle src and srcset
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
          }
          
          if (img.dataset.srcset) {
            img.srcset = img.dataset.srcset;
            img.removeAttribute('data-srcset');
          }
          
          // Add loaded class for potential styling
          img.classList.add('lazy-loaded');
          
          // Stop observing this image
          observer.unobserve(img);
        });
      },
      {
        rootMargin: '200px 0px', // Start loading images 200px before they enter the viewport
        threshold: 0.01
      }
    );

    // Start observing all lazy images
    lazyImages.forEach((img) => imageObserver.observe(img));
    
    // Return cleanup function
    return () => imageObserver.disconnect();
  } 
  
  // Fallback for browsers without IntersectionObserver
  let ticking = false;
  
  const lazyLoad = () => {
    if (ticking) return;
    
    ticking = true;
    
    requestAnimationFrame(() => {
      lazyImages.forEach((img) => {
        if (!img.dataset.src) return;
        
        const rect = img.getBoundingClientRect();
        const isInViewport =
          rect.top <= window.innerHeight + 200 && // 200px buffer
          rect.bottom >= -200 &&
          getComputedStyle(img).display !== 'none';
        
        if (isInViewport) {
          // Load the image
          img.src = img.dataset.src;
          
          if (img.dataset.srcset) {
            img.srcset = img.dataset.srcset;
          }
          
          // Add loaded class
          img.classList.add('lazy-loaded');
          
          // Clean up
          img.removeAttribute('data-src');
          img.removeAttribute('data-srcset');
        }
      });
      
      ticking = false;
    });
  };
  
  // Initial check
  lazyLoad();
  
  // Check if window is defined (browser environment)
  if (typeof window === 'undefined') {
    return;
  }

  // Add event listeners with passive for better performance
  const scrollOptions: AddEventListenerOptions = { passive: true };
  const resizeOptions: AddEventListenerOptions = { passive: true };
  const orientationOptions: AddEventListenerOptions = { passive: true };
  
  const win = window as Window & typeof globalThis;
  
  win.addEventListener('scroll', lazyLoad, scrollOptions);
  win.addEventListener('resize', lazyLoad, resizeOptions);
  win.addEventListener('orientationchange', lazyLoad, orientationOptions);
  
  // Return cleanup function
  return () => {
    win.removeEventListener('scroll', lazyLoad, scrollOptions);
    win.removeEventListener('resize', lazyLoad, resizeOptions);
    win.removeEventListener('orientationchange', lazyLoad, orientationOptions);
  };
}
