// Performance Monitoring Hook
// Tracks component performance, memory usage, and rendering metrics

import { useEffect, useRef, useState, useCallback } from 'react';

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage?: {
    used: number;
    total: number;
    limit: number;
  };
  fps?: number;
  componentMountTime: number;
  updateCount: number;
  lastUpdateTime: number;
}

interface PerformanceMonitorOptions {
  trackMemory?: boolean;
  trackFPS?: boolean;
  sampleInterval?: number;
  maxSamples?: number;
}

export function usePerformanceMonitor(
  componentName: string,
  options: PerformanceMonitorOptions = {}
) {
  const {
    trackMemory = true,
    trackFPS = false,
    sampleInterval = 1000,
    maxSamples = 100
  } = options;

  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    componentMountTime: Date.now(),
    updateCount: 0,
    lastUpdateTime: Date.now()
  });

  const mountTimeRef = useRef(Date.now());
  const renderStartRef = useRef<number>(0);
  const frameCountRef = useRef(0);
  const lastFrameTimeRef = useRef<number>(Date.now());
  const updateCountRef = useRef(0);
  const samplesRef = useRef<PerformanceMetrics[]>([]);

  // Track render performance
  const startRender = useCallback(() => {
    renderStartRef.current = performance.now();
  }, []);

  const endRender = useCallback(() => {
    const renderTime = performance.now() - renderStartRef.current;
    updateCountRef.current++;
    
    setMetrics(prev => ({
      ...prev,
      renderTime,
      updateCount: updateCountRef.current,
      lastUpdateTime: Date.now()
    }));

    // Store sample for analysis
    const sample: PerformanceMetrics = {
      renderTime,
      componentMountTime: mountTimeRef.current,
      updateCount: updateCountRef.current,
      lastUpdateTime: Date.now()
    };

    samplesRef.current.push(sample);
    if (samplesRef.current.length > maxSamples) {
      samplesRef.current.shift();
    }
  }, [maxSamples]);

  // Track memory usage
  const updateMemoryUsage = useCallback(() => {
    if (!trackMemory || !('memory' in performance)) return;

    const memory = (performance as any).memory;
    const memoryUsage = {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      limit: memory.jsHeapSizeLimit
    };

    setMetrics(prev => ({ ...prev, memoryUsage }));
  }, [trackMemory]);

  // Track FPS
  const updateFPS = useCallback(() => {
    if (!trackFPS) return;

    const now = Date.now();
    const delta = now - lastFrameTimeRef.current;
    
    if (delta >= 1000) {
      const fps = Math.round((frameCountRef.current * 1000) / delta);
      setMetrics(prev => ({ ...prev, fps }));
      frameCountRef.current = 0;
      lastFrameTimeRef.current = now;
    }
    
    frameCountRef.current++;
  }, [trackFPS]);

  // Performance monitoring loop
  useEffect(() => {
    const interval = setInterval(() => {
      updateMemoryUsage();
      updateFPS();
    }, sampleInterval);

    return () => clearInterval(interval);
  }, [sampleInterval, updateMemoryUsage, updateFPS]);

  // Component mount tracking
  useEffect(() => {
    mountTimeRef.current = Date.now();
    setMetrics(prev => ({
      ...prev,
      componentMountTime: mountTimeRef.current
    }));

    // Log component mount
    console.log(`[PerformanceMonitor] ${componentName} mounted at ${mountTimeRef.current}`);
  }, [componentName]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const totalTime = Date.now() - mountTimeRef.current;
      console.log(`[PerformanceMonitor] ${componentName} unmounted after ${totalTime}ms`);
      
      // Report performance summary
      if (samplesRef.current.length > 0) {
        const avgRenderTime = samplesRef.current.reduce((sum, s) => sum + s.renderTime, 0) / samplesRef.current.length;
        const maxRenderTime = Math.max(...samplesRef.current.map(s => s.renderTime));
        console.log(`[PerformanceMonitor] ${componentName} - Avg render: ${avgRenderTime.toFixed(2)}ms, Max: ${maxRenderTime.toFixed(2)}ms, Updates: ${updateCountRef.current}`);
      }
    };
  }, [componentName]);

  // Performance analysis
  const getPerformanceReport = useCallback(() => {
    if (samplesRef.current.length === 0) return null;

    const renderTimes = samplesRef.current.map(s => s.renderTime);
    const avgRenderTime = renderTimes.reduce((sum, time) => sum + time, 0) / renderTimes.length;
    const maxRenderTime = Math.max(...renderTimes);
    const minRenderTime = Math.min(...renderTimes);
    const p95RenderTime = renderTimes.sort((a, b) => a - b)[Math.floor(renderTimes.length * 0.95)];

    return {
      componentName,
      totalUpdates: updateCountRef.current,
      avgRenderTime,
      maxRenderTime,
      minRenderTime,
      p95RenderTime,
      samples: samplesRef.current.length,
      currentMemory: metrics.memoryUsage,
      currentFPS: metrics.fps,
      uptime: Date.now() - mountTimeRef.current
    };
  }, [componentName, metrics.memoryUsage, metrics.fps]);

  // Performance warnings
  useEffect(() => {
    if (metrics.renderTime > 16.67) { // 60fps threshold
      console.warn(`[PerformanceMonitor] ${componentName} slow render: ${metrics.renderTime.toFixed(2)}ms`);
    }

    if (metrics.memoryUsage && metrics.memoryUsage.used / metrics.memoryUsage.limit > 0.8) {
      console.warn(`[PerformanceMonitor] ${componentName} high memory usage: ${((metrics.memoryUsage.used / metrics.memoryUsage.limit) * 100).toFixed(1)}%`);
    }

    if (metrics.fps && metrics.fps < 30) {
      console.warn(`[PerformanceMonitor] ${componentName} low FPS: ${metrics.fps}`);
    }
  }, [componentName, metrics]);

  return {
    metrics,
    startRender,
    endRender,
    getPerformanceReport,
    samples: samplesRef.current
  };
}

// Higher-order component for automatic performance monitoring
export function withPerformanceMonitor<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string,
  options?: PerformanceMonitorOptions
) {
  const ComponentWithMonitor = (props: P) => {
    const name = componentName || WrappedComponent.displayName || WrappedComponent.name || 'Unknown';
    const { startRender, endRender } = usePerformanceMonitor(name, options);

    useEffect(() => {
      startRender();
      endRender();
    });

    return <WrappedComponent {...props} />;
  };

  ComponentWithMonitor.displayName = `withPerformanceMonitor(${WrappedComponent.displayName || WrappedComponent.name})`;
  return ComponentWithMonitor;
}

// Performance monitoring for async operations
export function trackAsyncPerformance<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> {
  const startTime = performance.now();
  
  return operation().then(
    result => {
      const duration = performance.now() - startTime;
      console.log(`[PerformanceMonitor] ${operationName} completed in ${duration.toFixed(2)}ms`);
      return result;
    },
    error => {
      const duration = performance.now() - startTime;
      console.error(`[PerformanceMonitor] ${operationName} failed after ${duration.toFixed(2)}ms:`, error);
      throw error;
    }
  );
}
