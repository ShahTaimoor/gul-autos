// Scroll performance testing utility
export const testScrollPerformance = () => {
  if (process.env.NODE_ENV !== 'development') return;

  let frameCount = 0;
  let lastTime = performance.now();
  let fps = 0;

  const measureFPS = () => {
    frameCount++;
    const currentTime = performance.now();
    
    if (currentTime - lastTime >= 1000) {
      fps = Math.round((frameCount * 1000) / (currentTime - lastTime.current));
      console.log(`🎯 Scroll FPS: ${fps}`);
      
      if (fps < 30) {
        console.warn('⚠️ Low scroll performance detected!');
      } else if (fps >= 55) {
        console.log('✅ Excellent scroll performance!');
      }
      
      frameCount = 0;
      lastTime = currentTime;
    }
    
    requestAnimationFrame(measureFPS);
  };

  // Start measuring when user scrolls
  let isMeasuring = false;
  const startMeasurement = () => {
    if (!isMeasuring) {
      isMeasuring = true;
      measureFPS();
    }
  };

  const stopMeasurement = () => {
    isMeasuring = false;
  };

  window.addEventListener('scroll', startMeasurement, { passive: true });
  window.addEventListener('scrollend', stopMeasurement, { passive: true });

  console.log('🚀 Scroll performance monitoring started');
};

// Test smooth scroll functionality
export const testSmoothScroll = () => {
  if (process.env.NODE_ENV !== 'development') return;

  const testScroll = () => {
    const startTime = performance.now();
    
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });

    const checkComplete = () => {
      if (window.pageYOffset === 0) {
        const endTime = performance.now();
        const duration = endTime - startTime;
        console.log(`⏱️ Smooth scroll to top took: ${duration.toFixed(2)}ms`);
      } else {
        requestAnimationFrame(checkComplete);
      }
    };

    requestAnimationFrame(checkComplete);
  };

  // Test after 2 seconds
  setTimeout(testScroll, 2000);
  console.log('🧪 Smooth scroll test scheduled');
};

// Initialize scroll performance monitoring
export const initScrollPerformanceMonitoring = () => {
  if (process.env.NODE_ENV !== 'development') return;

  testScrollPerformance();
  testSmoothScroll();
};
