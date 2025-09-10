import { useCallback, useRef, useEffect, useState } from 'react';

// Custom hook for smooth scrolling with performance optimizations
export const useSmoothScroll = () => {
  const isScrolling = useRef(false);
  const scrollTimeout = useRef(null);

  // Optimized smooth scroll function
  const smoothScrollTo = useCallback((target, offset = 0, duration = 800) => {
    if (isScrolling.current) return;
    
    isScrolling.current = true;
    
    const startPosition = window.pageYOffset;
    const targetPosition = typeof target === 'number' 
      ? target 
      : target.getBoundingClientRect().top + window.pageYOffset - offset;
    
    const distance = targetPosition - startPosition;
    const startTime = performance.now();

    // Use requestAnimationFrame for smooth animation
    const animateScroll = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeInOutCubic = progress < 0.5 
        ? 4 * progress * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      
      window.scrollTo(0, startPosition + distance * easeInOutCubic);
      
      if (progress < 1) {
        requestAnimationFrame(animateScroll);
      } else {
        isScrolling.current = false;
      }
    };

    requestAnimationFrame(animateScroll);
  }, []);

  // Scroll to top function
  const scrollToTop = useCallback((duration = 600) => {
    smoothScrollTo(0, 0, duration);
  }, [smoothScrollTo]);

  // Scroll to element function
  const scrollToElement = useCallback((elementId, offset = 80, duration = 800) => {
    const element = document.getElementById(elementId);
    if (element) {
      smoothScrollTo(element, offset, duration);
    }
  }, [smoothScrollTo]);

  // Scroll to section function
  const scrollToSection = useCallback((sectionId, offset = 80, duration = 800) => {
    const section = document.querySelector(`[data-section="${sectionId}"]`);
    if (section) {
      smoothScrollTo(section, offset, duration);
    }
  }, [smoothScrollTo]);

  return {
    smoothScrollTo,
    scrollToTop,
    scrollToElement,
    scrollToSection
  };
};

// Hook for scroll position tracking
export const useScrollPosition = () => {
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isAtTop, setIsAtTop] = useState(true);
  const [isAtBottom, setIsAtBottom] = useState(false);

  useEffect(() => {
    const updateScrollPosition = () => {
      const position = window.pageYOffset;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      
      setScrollPosition(position);
      setIsAtTop(position < 10);
      setIsAtBottom(position >= maxScroll - 10);
    };

    // Throttled scroll handler for better performance
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          updateScrollPosition();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    updateScrollPosition(); // Initial call

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return { scrollPosition, isAtTop, isAtBottom };
};

// Hook for scroll-based animations
export const useScrollAnimation = (threshold = 0.1) => {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      if (elementRef.current) {
        observer.unobserve(elementRef.current);
      }
    };
  }, [threshold]);

  return [elementRef, isVisible];
};

// Hook for scroll performance monitoring
export const useScrollPerformance = () => {
  const [scrollFPS, setScrollFPS] = useState(0);
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());

  useEffect(() => {
    const measureFPS = () => {
      frameCount.current++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime.current >= 1000) {
        setScrollFPS(Math.round((frameCount.current * 1000) / (currentTime - lastTime.current)));
        frameCount.current = 0;
        lastTime.current = currentTime;
      }
      
      requestAnimationFrame(measureFPS);
    };

    requestAnimationFrame(measureFPS);
  }, []);

  return scrollFPS;
};
