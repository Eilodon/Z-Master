// --- EXTREME SELF-HEALING AUTOMATION ---
// Implements Kubernetes self-healing + Netflix Hystrix patterns
// Automatic recovery, fault detection, and system resilience

import * as React from 'react';
import { logger } from '../src/utils/logger';

interface HealthCheck {
  id: string;
  name: string;
  check: () => Promise<boolean>;
  interval: number;
  timeout: number;
  failureThreshold: number;
  recoveryThreshold: number;
  lastCheck: number;
  consecutiveFailures: number;
  consecutiveSuccesses: number;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'recovering';
}

interface HealingAction {
  id: string;
  name: string;
  trigger: string; // Health check ID or condition
  action: () => Promise<void>;
  priority: 'low' | 'medium' | 'high' | 'critical';
  cooldown: number;
  lastExecuted: number;
  executionCount: number;
  successCount: number;
}

interface SystemMetrics {
  healthScore: number;
  uptime: number;
  totalChecks: number;
  failedChecks: number;
  healingActions: number;
  selfRecoveries: number;
  lastHealingAction: number;
}

class ExtremeSelfHealing {
  private static instance: ExtremeSelfHealing;
  private healthChecks = new Map<string, HealthCheck>();
  private healingActions = new Map<string, HealingAction>();
  private isRunning = false;
  private metrics: SystemMetrics = {
    healthScore: 1.0,
    uptime: Date.now(),
    totalChecks: 0,
    failedChecks: 0,
    healingActions: 0,
    selfRecoveries: 0,
    lastHealingAction: 0
  };
  private callbacks = new Set<(metrics: SystemMetrics) => void>();
  private monitoringInterval = 5000; // 5 seconds

  private constructor() {
    this.setupDefaultHealthChecks();
    this.setupDefaultHealingActions();
  }

  static getInstance(): ExtremeSelfHealing {
    if (!ExtremeSelfHealing.instance) {
      ExtremeSelfHealing.instance = new ExtremeSelfHealing();
    }
    return ExtremeSelfHealing.instance;
  }

  // --- SYSTEM CONTROL ---
  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.startMonitoring();
    logger.info('[SelfHealing] Started self-healing system');
  }

  stop(): void {
    this.isRunning = false;
    logger.info('[SelfHealing] Stopped self-healing system');
  }

  // --- MONITORING LOOP ---
  private startMonitoring(): void {
    const monitor = async () => {
      if (!this.isRunning) return;

      try {
        await this.runHealthChecks();
        await this.evaluateHealingActions();
        this.updateMetrics();
        this.notifyCallbacks();
      } catch (error) {
        logger.error('[SelfHealing] Monitoring error:', error);
      }

      // Schedule next monitoring cycle
      setTimeout(() => monitor(), this.monitoringInterval);
    };

    monitor();
  }

  // --- HEALTH CHECKS ---
  private setupDefaultHealthChecks(): void {
    // Memory health check
    this.addHealthCheck({
      id: 'memory',
      name: 'Memory Usage',
      check: async () => {
        if ('memory' in performance) {
          const mem = (performance as any).memory;
          const usage = mem.usedJSHeapSize / mem.jsHeapSizeLimit;
          return usage < 0.85; // 85% threshold
        }
        return true; // Assume healthy if no memory API
      },
      interval: 5000,
      timeout: 1000,
      failureThreshold: 3,
      recoveryThreshold: 5
    });

    // Performance health check
    this.addHealthCheck({
      id: 'performance',
      name: 'Frame Rate',
      check: async () => {
        return new Promise((resolve) => {
          const startTime = performance.now();
          requestAnimationFrame(() => {
            const frameTime = performance.now() - startTime;
            resolve(frameTime < 16.67 * 2); // Allow 2x target frame time
          });
        });
      },
      interval: 1000,
      timeout: 100,
      failureThreshold: 5,
      recoveryThreshold: 3
    });

    // Network health check
    this.addHealthCheck({
      id: 'network',
      name: 'Network Connectivity',
      check: async () => {
        try {
          const response = await fetch('https://httpbin.org/json', { 
            method: 'HEAD',
            signal: AbortSignal.timeout(3000)
          });
          return response.ok;
        } catch (error) {
          return false;
        }
      },
      interval: 10000,
      timeout: 3000,
      failureThreshold: 2,
      recoveryThreshold: 2
    });

    // Storage health check
    this.addHealthCheck({
      id: 'storage',
      name: 'Storage Availability',
      check: async () => {
        try {
          const testKey = 'health_check_' + Date.now();
          localStorage.setItem(testKey, 'test');
          localStorage.removeItem(testKey);
          return true;
        } catch (error) {
          return false;
        }
      },
      interval: 30000,
      timeout: 1000,
      failureThreshold: 1,
      recoveryThreshold: 3
    });
  }

  private setupDefaultHealingActions(): void {
    // Memory cleanup action
    this.addHealingAction({
      id: 'memory-cleanup',
      name: 'Memory Cleanup',
      trigger: 'memory',
      action: async () => {
        logger.info('[SelfHealing] Executing memory cleanup');
        
        // Trigger garbage collection if available
        if (process.env.NODE_ENV === 'development' && 'gc' in window) {
          (window as any).gc();
        }

        // Dispatch cleanup event
        window.dispatchEvent(new CustomEvent('memory-cleanup', {
          detail: { reason: 'self-healing' }
        }));

        // Clear caches
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          await Promise.all(cacheNames.map(name => caches.delete(name)));
        }
      },
      priority: 'high',
      cooldown: 30000 // 30 seconds
    });

    // Performance optimization action
    this.addHealingAction({
      id: 'performance-optimization',
      name: 'Performance Optimization',
      trigger: 'performance',
      action: async () => {
        logger.info('[SelfHealing] Executing performance optimization');
        
        // Reduce quality settings
        window.dispatchEvent(new CustomEvent('quality-change', {
          detail: { reason: 'performance-degradation' }
        }));

        // Pause non-critical animations
        document.querySelectorAll('[data-pausable]').forEach(el => {
          (el as HTMLElement).style.animationPlayState = 'paused';
        });
      },
      priority: 'medium',
      cooldown: 60000 // 1 minute
    });

    // Network retry action
    this.addHealingAction({
      id: 'network-retry',
      name: 'Network Retry',
      trigger: 'network',
      action: async () => {
        logger.info('[SelfHealing] Executing network retry');
        
        // Retry failed network requests
        window.dispatchEvent(new CustomEvent('network-retry', {
          detail: { reason: 'self-healing' }
        }));
      },
      priority: 'medium',
      cooldown: 15000 // 15 seconds
    });

    // Storage cleanup action
    this.addHealingAction({
      id: 'storage-cleanup',
      name: 'Storage Cleanup',
      trigger: 'storage',
      action: async () => {
        logger.info('[SelfHealing] Executing storage cleanup');
        
        // Clear old localStorage items
        const keys = Object.keys(localStorage);
        const now = Date.now();
        const dayAgo = now - (24 * 60 * 60 * 1000);
        
        keys.forEach(key => {
          if (key.startsWith('temp_')) {
            const value = localStorage.getItem(key);
            if (value) {
              try {
                const data = JSON.parse(value);
                if (data.timestamp && data.timestamp < dayAgo) {
                  localStorage.removeItem(key);
                }
              } catch (error) {
                // Remove invalid items
                localStorage.removeItem(key);
              }
            }
          }
        });
      },
      priority: 'low',
      cooldown: 300000 // 5 minutes
    });
  }

  // --- HEALTH CHECK EXECUTION ---
  private async runHealthChecks(): Promise<void> {
    const now = Date.now();
    
    for (const [id, check] of this.healthChecks.entries()) {
      if (now - check.lastCheck < check.interval) continue;
      
      try {
        const result = await Promise.race([
          check.check(),
          new Promise<boolean>((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), check.timeout)
          )
        ]);

        check.lastCheck = now;
        this.metrics.totalChecks++;

        if (result) {
          check.consecutiveSuccesses++;
          check.consecutiveFailures = 0;
          
          // Update status based on recovery
          if (check.status === 'unhealthy' && check.consecutiveSuccesses >= check.recoveryThreshold) {
            check.status = 'recovering';
            logger.info(`[SelfHealing] Health check recovering: ${check.name}`);
          } else if (check.status === 'recovering' && check.consecutiveSuccesses >= check.recoveryThreshold * 2) {
            check.status = 'healthy';
            logger.info(`[SelfHealing] Health check recovered: ${check.name}`);
            this.metrics.selfRecoveries++;
          }
        } else {
          check.consecutiveFailures++;
          check.consecutiveSuccesses = 0;
          this.metrics.failedChecks++;
          
          // Update status based on failures
          if (check.consecutiveFailures >= check.failureThreshold) {
            if (check.status === 'healthy') {
              check.status = 'degraded';
              logger.warn(`[SelfHealing] Health check degraded: ${check.name}`);
            } else if (check.status === 'degraded') {
              check.status = 'unhealthy';
              logger.error(`[SelfHealing] Health check unhealthy: ${check.name}`);
            }
          }
        }
      } catch (error) {
        check.consecutiveFailures++;
        check.consecutiveSuccesses = 0;
        this.metrics.failedChecks++;
        logger.error(`[SelfHealing] Health check error: ${check.name}`, error);
      }
    }
  }

  // --- HEALING ACTION EVALUATION ---
  private async evaluateHealingActions(): Promise<void> {
    const now = Date.now();
    
    for (const [id, action] of this.healingActions.entries()) {
      // Check cooldown
      if (now - action.lastExecuted < action.cooldown) continue;
      
      // Check if trigger condition is met
      const triggerCheck = this.healthChecks.get(action.trigger);
      if (!triggerCheck) continue;
      
      const shouldExecute = this.shouldExecuteAction(action, triggerCheck);
      if (!shouldExecute) continue;
      
      try {
        logger.info(`[SelfHealing] Executing healing action: ${action.name}`);
        await action.action();
        
        action.lastExecuted = now;
        action.executionCount++;
        action.successCount++;
        this.metrics.healingActions++;
        this.metrics.lastHealingAction = now;
        
      } catch (error) {
        action.executionCount++;
        logger.error(`[SelfHealing] Healing action failed: ${action.name}`, error);
      }
    }
  }

  private shouldExecuteAction(action: HealingAction, triggerCheck: HealthCheck): boolean {
    // Execute if check is unhealthy
    if (triggerCheck.status === 'unhealthy') return true;
    
    // Execute if check is degraded and action is high priority
    if (triggerCheck.status === 'degraded' && 
        (action.priority === 'high' || action.priority === 'critical')) {
      return true;
    }
    
    return false;
  }

  // --- METRICS & MONITORING ---
  private updateMetrics(): void {
    const healthyChecks = Array.from(this.healthChecks.values())
      .filter(check => check.status === 'healthy').length;
    const totalChecks = this.healthChecks.size;
    
    this.metrics.healthScore = totalChecks > 0 ? healthyChecks / totalChecks : 1.0;
    this.metrics.uptime = Date.now() - this.metrics.uptime;
  }

  private notifyCallbacks(): void {
    this.callbacks.forEach(callback => callback(this.metrics));
  }

  // --- PUBLIC API ---
  addHealthCheck(check: Omit<HealthCheck, 'lastCheck' | 'consecutiveFailures' | 'consecutiveSuccesses' | 'status'>): void {
    const fullCheck: HealthCheck = {
      ...check,
      lastCheck: 0,
      consecutiveFailures: 0,
      consecutiveSuccesses: 0,
      status: 'healthy'
    };
    
    this.healthChecks.set(check.id, fullCheck);
    logger.info(`[SelfHealing] Added health check: ${check.name}`);
  }

  addHealingAction(action: Omit<HealingAction, 'lastExecuted' | 'executionCount' | 'successCount'>): void {
    const fullAction: HealingAction = {
      ...action,
      lastExecuted: 0,
      executionCount: 0,
      successCount: 0
    };
    
    this.healingActions.set(action.id, fullAction);
    logger.info(`[SelfHealing] Added healing action: ${action.name}`);
  }

  getMetrics(): SystemMetrics {
    return { ...this.metrics };
  }

  getHealthChecks(): HealthCheck[] {
    return Array.from(this.healthChecks.values());
  }

  getHealingActions(): HealingAction[] {
    return Array.from(this.healingActions.values());
  }

  subscribe(callback: (metrics: SystemMetrics) => void): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  // --- MANUAL HEALING ---
  async executeHealingAction(actionId: string): Promise<boolean> {
    const action = this.healingActions.get(actionId);
    if (!action) return false;

    try {
      await action.action();
      action.lastExecuted = Date.now();
      action.executionCount++;
      action.successCount++;
      return true;
    } catch (error) {
      action.executionCount++;
      logger.error(`[SelfHealing] Manual healing action failed: ${action.name}`, error);
      return false;
    }
  }
}

// Export singleton instance
export const selfHealing = ExtremeSelfHealing.getInstance();

// Hook for React components
export function useSelfHealing() {
  const [metrics, setMetrics] = React.useState<SystemMetrics>(selfHealing.getMetrics());
  const [healthChecks, setHealthChecks] = React.useState<HealthCheck[]>(selfHealing.getHealthChecks());
  const [isRunning, setIsRunning] = React.useState(false);

  React.useEffect(() => {
    // Start self-healing if not already running
    if (!selfHealing['isRunning']) {
      selfHealing.start();
      setIsRunning(true);
    }

    // Subscribe to metrics updates
    const unsubscribe = selfHealing.subscribe((newMetrics) => {
      setMetrics(newMetrics);
      setHealthChecks(selfHealing.getHealthChecks());
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return {
    metrics,
    healthChecks,
    isRunning,
    start: selfHealing.start.bind(selfHealing),
    stop: selfHealing.stop.bind(selfHealing),
    executeHealingAction: selfHealing.executeHealingAction.bind(selfHealing),
    getHealingActions: selfHealing.getHealingActions.bind(selfHealing)
  };
}
