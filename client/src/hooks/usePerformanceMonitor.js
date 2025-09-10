import { useState, useEffect, useRef } from 'react';
import performanceMonitor from '../utils/performanceMonitor';

// Hook for monitoring component performance
export const useComponentPerformance = (componentName) => {
  const [metrics, setMetrics] = useState({
    fps: 0,
    frameTime: 0,
    memoryUsage: 0,
    renderCount: 0
  });
  
  const renderCount = useRef(0);
  const mountTime = useRef(performance.now());

  useEffect(() => {
    renderCount.current += 1;
    
    const updateMetrics = (newMetrics) => {
      setMetrics(prev => ({
        ...prev,
        ...newMetrics,
        renderCount: renderCount.current
      }));
    };

    performanceMonitor.addCallback(updateMetrics);
    
    if (process.env.NODE_ENV === 'development') {
      const endTime = performance.now();
      const mountDuration = endTime - mountTime.current;
      console.log(`⏱️ ${componentName} - Mount Time: ${mountDuration.toFixed(2)}ms`);
    }

    return () => {
      // Cleanup callback if needed
    };
  }, [componentName]);

  return {
    ...metrics,
    is60FPS: metrics.fps >= 55,
    recommendations: performanceMonitor.getRecommendations()
  };
};

// Hook for monitoring scroll performance
export const useScrollPerformance = () => {
  const [scrollMetrics, setScrollMetrics] = useState({
    scrollFPS: 0,
    isScrolling: false
  });

  useEffect(() => {
    let isScrolling = false;
    let scrollFrameCount = 0;
    let scrollLastTime = performance.now();

    const handleScroll = () => {
      if (!isScrolling) {
        isScrolling = true;
        setScrollMetrics(prev => ({ ...prev, isScrolling: true }));
      }
    };

    const measureScrollFPS = () => {
      if (isScrolling) {
        scrollFrameCount++;
        const currentTime = performance.now();
        
        if (currentTime - scrollLastTime >= 1000) {
          const scrollFPS = Math.round((scrollFrameCount * 1000) / (currentTime - scrollLastTime));
          setScrollMetrics(prev => ({ 
            ...prev, 
            scrollFPS,
            isScrolling: false 
          }));
          scrollFrameCount = 0;
          scrollLastTime = currentTime;
        }
        
        requestAnimationFrame(measureScrollFPS);
      } else {
        requestAnimationFrame(measureScrollFPS);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('scrollend', () => { 
      isScrolling = false; 
      setScrollMetrics(prev => ({ ...prev, isScrolling: false }));
    }, { passive: true });
    
    requestAnimationFrame(measureScrollFPS);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('scrollend', () => {});
    };
  }, []);

  return {
    ...scrollMetrics,
    isSmoothScroll: scrollMetrics.scrollFPS >= 55
  };
};

// Hook for monitoring animation performance
export const useAnimationPerformance = () => {
  const [animationMetrics, setAnimationMetrics] = useState({
    animationFPS: 0,
    isAnimating: false
  });

  useEffect(() => {
    let animationFrameCount = 0;
    let animationLastTime = performance.now();
    let isAnimating = false;

    const measureAnimationFPS = () => {
      if (isAnimating) {
        animationFrameCount++;
        const currentTime = performance.now();
        
        if (currentTime - animationLastTime >= 1000) {
          const animationFPS = Math.round((animationFrameCount * 1000) / (currentTime - animationLastTime));
          setAnimationMetrics(prev => ({ 
            ...prev, 
            animationFPS,
            isAnimating: false 
          }));
          animationFrameCount = 0;
          animationLastTime = currentTime;
        }
      }
      
      requestAnimationFrame(measureAnimationFPS);
    };

    // Monitor CSS animations
    const handleAnimationStart = () => {
      isAnimating = true;
      setAnimationMetrics(prev => ({ ...prev, isAnimating: true }));
    };

    const handleAnimationEnd = () => {
      isAnimating = false;
      setAnimationMetrics(prev => ({ ...prev, isAnimating: false }));
    };

    document.addEventListener('animationstart', handleAnimationStart);
    document.addEventListener('animationend', handleAnimationEnd);
    document.addEventListener('transitionstart', handleAnimationStart);
    document.addEventListener('transitionend', handleAnimationEnd);
    
    requestAnimationFrame(measureAnimationFPS);

    return () => {
      document.removeEventListener('animationstart', handleAnimationStart);
      document.removeEventListener('animationend', handleAnimationEnd);
      document.removeEventListener('transitionstart', handleAnimationStart);
      document.removeEventListener('transitionend', handleAnimationEnd);
    };
  }, []);

  return {
    ...animationMetrics,
    isSmoothAnimation: animationMetrics.animationFPS >= 55
  };
};

// Hook for overall performance monitoring
export const useOverallPerformance = () => {
  const [overallMetrics, setOverallMetrics] = useState({
    fps: 0,
    frameTime: 0,
    memoryUsage: 0,
    scrollFPS: 0,
    animationFPS: 0,
    is60FPS: false
  });

  useEffect(() => {
    const updateMetrics = (metrics) => {
      setOverallMetrics(prev => ({
        ...prev,
        ...metrics,
        is60FPS: metrics.fps >= 55
      }));
    };

    performanceMonitor.addCallback(updateMetrics);
    performanceMonitor.startMonitoring();

    return () => {
      performanceMonitor.stopMonitoring();
    };
  }, []);

  return {
    ...overallMetrics,
    recommendations: performanceMonitor.getRecommendations(),
    startMonitoring: () => performanceMonitor.startMonitoring(),
    stopMonitoring: () => performanceMonitor.stopMonitoring()
  };
};