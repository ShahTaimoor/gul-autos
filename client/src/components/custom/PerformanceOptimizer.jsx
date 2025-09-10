import React, { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';

/**
 * Performance optimization component that provides:
 * - Image preloading for critical images
 * - Resource hints for better loading
 * - Memory cleanup
 */
const PerformanceOptimizer = () => {
  const { products } = useSelector((state) => state.products);
  const { categories } = useSelector((state) => state.categories);

  // Preload critical images
  const criticalImages = useMemo(() => {
    const images = [];
    
    // Preload first few product images
    if (products?.length > 0) {
      products.slice(0, 6).forEach(product => {
        if (product.image) {
          images.push(product.image);
        }
      });
    }
    
    // Preload category images
    if (categories?.length > 0) {
      categories.slice(0, 4).forEach(category => {
        const imageUrl = category.image || category.picture?.secure_url;
        if (imageUrl) {
          images.push(imageUrl);
        }
      });
    }
    
    return images;
  }, [products, categories]);

  useEffect(() => {
    // Preload critical images
    criticalImages.forEach(imageUrl => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = imageUrl;
      document.head.appendChild(link);
    });

    // Add resource hints for better performance
    const addResourceHint = (href, rel) => {
      const link = document.createElement('link');
      link.rel = rel;
      link.href = href;
      document.head.appendChild(link);
    };

    // DNS prefetch for external domains
    addResourceHint('https://fonts.googleapis.com', 'dns-prefetch');
    addResourceHint('https://fonts.gstatic.com', 'dns-prefetch');

    // Cleanup function
    return () => {
      // Remove preload links when component unmounts
      const preloadLinks = document.querySelectorAll('link[rel="preload"]');
      preloadLinks.forEach(link => {
        if (criticalImages.includes(link.href)) {
          link.remove();
        }
      });
    };
  }, [criticalImages]);

  // Memory optimization: Clean up unused resources
  useEffect(() => {
    const cleanup = () => {
      // Force garbage collection if available (development only)
      if (process.env.NODE_ENV === 'development' && window.gc) {
        window.gc();
      }
    };

    // Cleanup every 30 seconds
    const interval = setInterval(cleanup, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Intersection Observer for lazy loading optimization
  useEffect(() => {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
              imageObserver.unobserve(img);
            }
          }
        });
      }, {
        rootMargin: '50px 0px',
        threshold: 0.01
      });

      // Observe all images with data-src attribute
      const lazyImages = document.querySelectorAll('img[data-src]');
      lazyImages.forEach(img => imageObserver.observe(img));

      return () => imageObserver.disconnect();
    }
  }, []);

  return null; // This component doesn't render anything
};

export default React.memo(PerformanceOptimizer);
