import { useEffect, useRef } from 'react';

/**
 * Hook to measure component render performance
 * @param {string} componentName - Name of the component for logging
 */
export function usePerformanceMonitor(componentName) {
  const renderCount = useRef(0);
  const startTime = useRef(performance.now());

  useEffect(() => {
    renderCount.current += 1;
    const endTime = performance.now();
    const renderTime = endTime - startTime.current;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`${componentName} render #${renderCount.current}: ${renderTime.toFixed(2)}ms`);
    }
    
    startTime.current = performance.now();
  });

  return {
    renderCount: renderCount.current,
    measureRender: (fn) => {
      const start = performance.now();
      const result = fn();
      const end = performance.now();
      if (process.env.NODE_ENV === 'development') {
        console.log(`${componentName} operation: ${(end - start).toFixed(2)}ms`);
      }
      return result;
    }
  };
}

/**
 * Hook to monitor memory usage (development only)
 */
export function useMemoryMonitor() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && 'memory' in performance) {
      const logMemory = () => {
        const memory = performance.memory;
        console.log('Memory Usage:', {
          used: `${(memory.usedJSHeapSize / 1048576).toFixed(2)} MB`,
          total: `${(memory.totalJSHeapSize / 1048576).toFixed(2)} MB`,
          limit: `${(memory.jsHeapSizeLimit / 1048576).toFixed(2)} MB`
        });
      };
      
      logMemory();
      const interval = setInterval(logMemory, 10000); // Log every 10 seconds
      
      return () => clearInterval(interval);
    }
  }, []);
}
