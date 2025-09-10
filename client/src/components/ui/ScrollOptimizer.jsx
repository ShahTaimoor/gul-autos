import React, { useEffect, useRef } from 'react';

// Component to optimize scroll performance
const ScrollOptimizer = ({ children, className = '' }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Add scroll performance optimizations
    const handleScroll = () => {
      // Use requestAnimationFrame for smooth scrolling
      requestAnimationFrame(() => {
        // Any scroll-based logic can go here
      });
    };

    // Add passive event listener for better performance
    container.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className={`scroll-container ${className}`}
      style={{
        // Enable hardware acceleration
        transform: 'translateZ(0)',
        WebkitTransform: 'translateZ(0)',
        // Optimize scrolling
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'contain',
        // Improve rendering
        willChange: 'scroll-position',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden'
      }}
    >
      {children}
    </div>
  );
};

export default ScrollOptimizer;
