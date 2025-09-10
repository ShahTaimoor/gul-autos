// Comprehensive performance monitoring for 60fps optimization
class PerformanceMonitor {
  constructor() {
    this.fps = 0;
    this.frameCount = 0;
    this.lastTime = performance.now();
    this.isMonitoring = false;
    this.callbacks = [];
    this.metrics = {
      fps: 0,
      frameTime: 0,
      memoryUsage: 0,
      renderTime: 0,
      scrollFPS: 0
    };
  }

  // Start FPS monitoring
  startMonitoring() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.monitorFPS();
    this.monitorMemory();
    this.monitorScroll();
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🚀 Performance monitoring started');
    }
  }

  // Stop monitoring
  stopMonitoring() {
    this.isMonitoring = false;
  }

  // Monitor FPS
  monitorFPS() {
    const measureFPS = () => {
      if (!this.isMonitoring) return;
      
      this.frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - this.lastTime >= 1000) {
        this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastTime));
        this.metrics.fps = this.fps;
        this.metrics.frameTime = 1000 / this.fps;
        
        this.notifyCallbacks();
        
        if (process.env.NODE_ENV === 'development') {
          this.logPerformance();
        }
        
        this.frameCount = 0;
        this.lastTime = currentTime;
      }
      
      requestAnimationFrame(measureFPS);
    };
    
    requestAnimationFrame(measureFPS);
  }

  // Monitor memory usage
  monitorMemory() {
    if (!performance.memory) return;
    
    setInterval(() => {
      if (!this.isMonitoring) return;
      
      this.metrics.memoryUsage = {
        used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
      };
    }, 1000);
  }

  // Monitor scroll performance
  monitorScroll() {
    let scrollFrameCount = 0;
    let scrollLastTime = performance.now();
    let isScrolling = false;

    const handleScroll = () => {
      if (!isScrolling) {
        isScrolling = true;
        scrollFrameCount = 0;
        scrollLastTime = performance.now();
      }
    };

    const measureScrollFPS = () => {
      if (isScrolling) {
        scrollFrameCount++;
        const currentTime = performance.now();
        
        if (currentTime - scrollLastTime >= 1000) {
          this.metrics.scrollFPS = Math.round((scrollFrameCount * 1000) / (currentTime - scrollLastTime));
          scrollFrameCount = 0;
          scrollLastTime = currentTime;
        }
        
        requestAnimationFrame(measureScrollFPS);
      } else {
        requestAnimationFrame(measureScrollFPS);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('scrollend', () => { isScrolling = false; }, { passive: true });
    requestAnimationFrame(measureScrollFPS);
  }

  // Log performance metrics
  logPerformance() {
    const { fps, frameTime, memoryUsage, scrollFPS } = this.metrics;
    
    let status = '🟢';
    if (fps < 30) status = '🔴';
    else if (fps < 50) status = '🟡';
    
    console.log(`${status} FPS: ${fps} | Frame Time: ${frameTime.toFixed(2)}ms | Memory: ${memoryUsage?.used || 0}MB | Scroll FPS: ${scrollFPS}`);
    
    if (fps < 30) {
      console.warn('⚠️ Low FPS detected! Consider optimizing animations and rendering.');
    }
  }

  // Add callback for performance updates
  addCallback(callback) {
    this.callbacks.push(callback);
  }

  // Notify callbacks
  notifyCallbacks() {
    this.callbacks.forEach(callback => callback(this.metrics));
  }

  // Get current metrics
  getMetrics() {
    return this.metrics;
  }

  // Check if 60fps is achievable
  is60FPSAchievable() {
    return this.fps >= 55; // Allow some tolerance
  }

  // Get performance recommendations
  getRecommendations() {
    const recommendations = [];
    
    if (this.fps < 30) {
      recommendations.push('🔴 Critical: FPS below 30. Optimize heavy animations and reduce DOM complexity.');
    } else if (this.fps < 50) {
      recommendations.push('🟡 Warning: FPS below 50. Consider optimizing images and reducing JavaScript execution.');
    } else if (this.fps < 55) {
      recommendations.push('🟡 Notice: FPS below 55. Fine-tune animations and optimize rendering.');
    } else {
      recommendations.push('🟢 Excellent: 60fps performance achieved!');
    }
    
    if (this.metrics.memoryUsage?.used > 100) {
      recommendations.push('⚠️ High memory usage detected. Consider implementing memory optimization.');
    }
    
    return recommendations;
  }
}

// Create global instance
const performanceMonitor = new PerformanceMonitor();

// Auto-start in development
if (process.env.NODE_ENV === 'development') {
  performanceMonitor.startMonitoring();
}

export default performanceMonitor;
