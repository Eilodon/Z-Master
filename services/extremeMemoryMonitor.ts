// --- EXTREME REAL-TIME MEMORY MONITORING ---
// Implements Chrome DevTools memory profiling + Netflix monitoring patterns
// Real-time memory pressure detection with automatic optimization

import * as React from 'react';
import { logger } from '../src/utils/logger';

interface MemoryMetrics {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  memoryPressure: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  leakScore: number;
  gcCount: number;
  lastGC: number;
}

interface PerformanceMetrics {
  frameRate: number;
  frameDrops: number;
  renderTime: number;
  scriptTime: number;
  paintTime: number;
  layoutTime: number;
}

interface SystemMetrics {
  cpuUsage: number;
  networkLatency: number;
  storageQuota: number;
  storageUsed: number;
  batteryLevel?: number;
  memoryPressure?: number;
}

class ExtremeMemoryMonitor {
  private static instance: ExtremeMemoryMonitor;
  private isMonitoring = false;
  private monitoringInterval = 1000; // 1 second
  private history: MemoryMetrics[] = [];
  private maxHistoryLength = 300; // 5 minutes at 1s intervals
  private performanceObserver: PerformanceObserver | null = null;
  private frameCount = 0;
  private lastFrameTime = performance.now();
  private frameDrops = 0;
  private gcCount = 0;
  private lastGC = 0;
  private memoryBaseline = 0;
  private callbacks = new Set<(metrics: MemoryMetrics) => void>();

  private constructor() {
    this.setupPerformanceObserver();
    this.setupGCMonitoring();
    this.memoryBaseline = this.getCurrentMemoryUsage().usedJSHeapSize;
  }

  static getInstance(): ExtremeMemoryMonitor {
    if (!ExtremeMemoryMonitor.instance) {
      ExtremeMemoryMonitor.instance = new ExtremeMemoryMonitor();
    }
    return ExtremeMemoryMonitor.instance;
  }

  // --- MONITORING CONTROL ---
  start(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.startMonitoringLoop();
    logger.info('[MemoryMonitor] Started memory monitoring');
  }

  stop(): void {
    this.isMonitoring = false;
    logger.info('[MemoryMonitor] Stopped memory monitoring');
  }

  // --- MONITORING LOOP ---
  private startMonitoringLoop(): void {
    const monitor = () => {
      if (!this.isMonitoring) return;

      const metrics = this.collectMemoryMetrics();
      this.history.push(metrics);
      
      // Maintain history length
      if (this.history.length > this.maxHistoryLength) {
        this.history.shift();
      }

      // Notify callbacks
      this.callbacks.forEach(callback => callback(metrics));

      // Check for critical conditions
      this.checkCriticalConditions(metrics);

      // Schedule next monitoring
      setTimeout(() => requestAnimationFrame(monitor), this.monitoringInterval);
    };

    requestAnimationFrame(monitor);
  }

  // --- MEMORY METRICS COLLECTION ---
  private collectMemoryMetrics(): MemoryMetrics {
    const memory = this.getCurrentMemoryUsage();
    const memoryPressure = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
    const trend = this.calculateTrend();
    const leakScore = this.calculateLeakScore();

    return {
      ...memory,
      memoryPressure,
      trend,
      leakScore,
      gcCount: this.gcCount,
      lastGC: this.lastGC
    };
  }

  private getCurrentMemoryUsage(): MemoryMetrics {
    if ('memory' in performance) {
      const mem = (performance as any).memory;
      return {
        usedJSHeapSize: mem.usedJSHeapSize,
        totalJSHeapSize: mem.totalJSHeapSize,
        jsHeapSizeLimit: mem.jsHeapSizeLimit,
        memoryPressure: 0,
        trend: 'stable',
        leakScore: 0,
        gcCount: 0,
        lastGC: 0
      };
    }

    // Fallback for browsers without memory API
    return {
      usedJSHeapSize: 0,
      totalJSHeapSize: 0,
      jsHeapSizeLimit: 0,
      memoryPressure: 0,
      trend: 'stable',
      leakScore: 0,
      gcCount: 0,
      lastGC: 0
    };
  }

  // --- TREND ANALYSIS ---
  private calculateTrend(): 'increasing' | 'decreasing' | 'stable' {
    if (this.history.length < 10) return 'stable';

    const recent = this.history.slice(-10);
    const first = recent[0].usedJSHeapSize;
    const last = recent[recent.length - 1].usedJSHeapSize;
    const change = (last - first) / first;

    if (change > 0.05) return 'increasing';
    if (change < -0.05) return 'decreasing';
    return 'stable';
  }

  // --- LEAK DETECTION ---
  private calculateLeakScore(): number {
    if (this.history.length < 60) return 0; // Need 1 minute of data

    const recent = this.history.slice(-60);
    const baseline = this.memoryBaseline;
    
    // Calculate growth rate
    const growth = recent[recent.length - 1].usedJSHeapSize - baseline;
    const growthRate = growth / baseline;

    // Calculate volatility
    const values = recent.map(m => m.usedJSHeapSize);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
    const volatility = Math.sqrt(variance) / mean;

    // Combine factors for leak score
    const leakScore = Math.min(100, (growthRate * 50) + (volatility * 30));
    return Math.max(0, leakScore);
  }

  // --- PERFORMANCE MONITORING ---
  private setupPerformanceObserver(): void {
    if ('PerformanceObserver' in window) {
      this.performanceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        
        for (const entry of entries) {
          if (entry.entryType === 'measure') {
            // Track custom performance metrics
            logger.log(`[MemoryMonitor] Performance measure: ${entry.name} - ${entry.duration}ms`);
          }
        }
      });

      this.performanceObserver.observe({ entryTypes: ['measure', 'navigation', 'resource'] });
    }
  }

  // --- GC MONITORING ---
  private setupGCMonitoring(): void {
    // Monitor garbage collection through performance timing
    let lastGC = performance.now();
    
    const checkGC = () => {
      const now = performance.now();
      
      // Simple GC detection based on timing gaps
      if (now - lastGC > 100) {
        this.gcCount++;
        this.lastGC = now;
        logger.log(`[MemoryMonitor] Garbage collection detected (${this.gcCount})`);
      }
      
      lastGC = now;
      requestAnimationFrame(checkGC);
    };
    
    requestAnimationFrame(checkGC);
  }

  // --- CRITICAL CONDITION CHECKING ---
  private checkCriticalConditions(metrics: MemoryMetrics): void {
    // High memory pressure
    if (metrics.memoryPressure > 0.9) {
      logger.warn(`[MemoryMonitor] Critical memory pressure: ${(metrics.memoryPressure * 100).toFixed(1)}%`);
      this.triggerMemoryCleanup();
    }

    // Potential memory leak
    if (metrics.leakScore > 70) {
      logger.error(`[MemoryMonitor] Potential memory leak detected (score: ${metrics.leakScore.toFixed(1)})`);
      this.triggerLeakMitigation();
    }

    // Increasing trend with high usage
    if (metrics.trend === 'increasing' && metrics.memoryPressure > 0.7) {
      logger.warn(`[MemoryMonitor] Memory increasing under pressure`);
      this.triggerOptimization();
    }
  }

  // --- MITIGATION ACTIONS ---
  private triggerMemoryCleanup(): void {
    logger.info('[MemoryMonitor] Triggering memory cleanup');
    
    // Force garbage collection if available
    if (process.env.NODE_ENV === 'development' && 'gc' in window) {
      (window as any).gc();
    }

    // Notify components to clean up
    this.notifyCleanup('memory-pressure');
  }

  private triggerLeakMitigation(): void {
    logger.warn('[MemoryMonitor] Triggering leak mitigation');
    
    // Clear caches and temporary data
    this.notifyCleanup('leak-detected');
    
    // Reduce monitoring frequency to save memory
    this.monitoringInterval = 5000;
  }

  private triggerOptimization(): void {
    logger.info('[MemoryMonitor] Triggering optimization');
    this.notifyCleanup('optimization');
  }

  private notifyCleanup(reason: string): void {
    // Dispatch custom event for components to listen to
    window.dispatchEvent(new CustomEvent('memory-cleanup', { detail: { reason } }));
  }

  // --- PUBLIC API ---
  getCurrentMetrics(): MemoryMetrics | null {
    return this.history.length > 0 ? this.history[this.history.length - 1] : null;
  }

  getHistory(): MemoryMetrics[] {
    return [...this.history];
  }

  getTrendData(): { timestamps: number[]; values: number[] } {
    return {
      timestamps: this.history.map(m => Date.now()),
      values: this.history.map(m => m.usedJSHeapSize)
    };
  }

  subscribe(callback: (metrics: MemoryMetrics) => void): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  // --- PERFORMANCE METRICS ---
  getPerformanceMetrics(): PerformanceMetrics {
    const now = performance.now();
    const deltaTime = now - this.lastFrameTime;
    const currentFPS = 1000 / deltaTime;
    
    this.lastFrameTime = now;
    this.frameCount++;

    // Detect frame drops
    if (deltaTime > 16.67 * 2) { // More than 2x expected frame time
      this.frameDrops++;
    }

    return {
      frameRate: currentFPS,
      frameDrops: this.frameDrops,
      renderTime: 0, // Would need custom timing
      scriptTime: 0,
      paintTime: 0,
      layoutTime: 0
    };
  }

  // --- SYSTEM METRICS ---
  async getSystemMetrics(): Promise<SystemMetrics> {
    const metrics: SystemMetrics = {
      cpuUsage: 0,
      networkLatency: 0,
      storageQuota: 0,
      storageUsed: 0
    };

    // Network latency test
    try {
      const start = performance.now();
      await fetch('https://httpbin.org/json', { method: 'HEAD' });
      metrics.networkLatency = performance.now() - start;
    } catch (error) {
      logger.warn('[MemoryMonitor] Network latency test failed');
    }

    // Storage quota
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        metrics.storageQuota = estimate.quota || 0;
        metrics.storageUsed = estimate.usage || 0;
      } catch (error) {
        logger.warn('[MemoryMonitor] Storage estimate failed');
      }
    }

    // Battery level
    if ('getBattery' in navigator) {
      try {
        const battery = await (navigator as any).getBattery();
        metrics.batteryLevel = battery.level;
      } catch (error) {
        logger.warn('[MemoryMonitor] Battery info failed');
      }
    }

    return metrics;
  }

  // --- DASHBOARD DATA ---
  getDashboardData(): {
    memory: MemoryMetrics;
    performance: PerformanceMetrics;
    system: SystemMetrics;
    history: MemoryMetrics[];
  } {
    return {
      memory: this.getCurrentMetrics() || {} as MemoryMetrics,
      performance: this.getPerformanceMetrics(),
      system: {} as SystemMetrics, // Would be async
      history: this.getHistory()
    };
  }
}

// Export singleton instance
export const memoryMonitor = ExtremeMemoryMonitor.getInstance();

// Hook for React components
export function useMemoryMonitor() {
  const [metrics, setMetrics] = React.useState<MemoryMetrics | null>(null);
  const [isMonitoring, setIsMonitoring] = React.useState(false);

  React.useEffect(() => {
    // Start monitoring if not already started
    if (!memoryMonitor['isMonitoring']) {
      memoryMonitor.start();
      setIsMonitoring(true);
    }

    // Subscribe to metrics updates
    const unsubscribe = memoryMonitor.subscribe((newMetrics) => {
      setMetrics(newMetrics);
    });

    // Get initial metrics
    const initialMetrics = memoryMonitor.getCurrentMetrics();
    if (initialMetrics) {
      setMetrics(initialMetrics);
    }

    return () => {
      unsubscribe();
    };
  }, []);

  return {
    metrics,
    isMonitoring,
    start: memoryMonitor.start.bind(memoryMonitor),
    stop: memoryMonitor.stop.bind(memoryMonitor),
    getCurrentMetrics: memoryMonitor.getCurrentMetrics.bind(memoryMonitor),
    getHistory: memoryMonitor.getHistory.bind(memoryMonitor),
    getTrendData: memoryMonitor.getTrendData.bind(memoryMonitor)
  };
}
