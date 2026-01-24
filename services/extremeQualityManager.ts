// --- EXTREME PROGRESSIVE QUALITY DEGRADATION ---
// Implements YouTube adaptive streaming + Netflix quality scaling
// Automatic performance optimization based on device capabilities

import * as React from 'react';
import { logger } from '../src/utils/logger';

interface QualityLevel {
  name: 'ultra' | 'high' | 'medium' | 'low' | 'minimal';
  resolution: { width: number; height: number };
  frameRate: number;
  bitrate: number;
  complexity: number;
  memoryBudget: number;
  cpuBudget: number;
}

interface QualityMetrics {
  currentLevel: QualityLevel;
  targetLevel: QualityLevel;
  performanceScore: number;
  stabilityScore: number;
  userExperienceScore: number;
  adaptationReason: string;
  lastAdaptation: number;
}

interface PerformanceThresholds {
  maxFrameTime: number;
  maxMemoryUsage: number;
  maxCPUUsage: number;
  minFrameRate: number;
  stabilityWindow: number;
}

class ProgressiveQualityManager {
  private static instance: ProgressiveQualityManager;
  private currentQuality: QualityLevel;
  private targetQuality: QualityLevel;
  private metrics: QualityMetrics;
  private performanceHistory: number[] = [];
  private maxHistoryLength = 60; // 1 minute at 60fps
  private adaptationCooldown = 2000; // 2 seconds
  private lastAdaptation = 0;
  private isAdapting = false;
  private callbacks = new Set<(quality: QualityLevel) => void>();

  private readonly qualityLevels: QualityLevel[] = [
    {
      name: 'ultra',
      resolution: { width: 1920, height: 1080 },
      frameRate: 60,
      bitrate: 8000,
      complexity: 1.0,
      memoryBudget: 512 * 1024 * 1024, // 512MB
      cpuBudget: 0.8
    },
    {
      name: 'high',
      resolution: { width: 1280, height: 720 },
      frameRate: 60,
      bitrate: 4000,
      complexity: 0.75,
      memoryBudget: 256 * 1024 * 1024, // 256MB
      cpuBudget: 0.6
    },
    {
      name: 'medium',
      resolution: { width: 854, height: 480 },
      frameRate: 30,
      bitrate: 2000,
      complexity: 0.5,
      memoryBudget: 128 * 1024 * 1024, // 128MB
      cpuBudget: 0.4
    },
    {
      name: 'low',
      resolution: { width: 640, height: 360 },
      frameRate: 30,
      bitrate: 1000,
      complexity: 0.25,
      memoryBudget: 64 * 1024 * 1024, // 64MB
      cpuBudget: 0.3
    },
    {
      name: 'minimal',
      resolution: { width: 426, height: 240 },
      frameRate: 15,
      bitrate: 500,
      complexity: 0.1,
      memoryBudget: 32 * 1024 * 1024, // 32MB
      cpuBudget: 0.2
    }
  ];

  private readonly thresholds: PerformanceThresholds = {
    maxFrameTime: 16.67, // 60fps target
    maxMemoryUsage: 0.8, // 80% of available memory
    maxCPUUsage: 0.7, // 70% CPU usage
    minFrameRate: 15, // Minimum acceptable framerate
    stabilityWindow: 5000 // 5 seconds
  };

  private constructor() {
    // Start with high quality and let adaptation adjust
    this.currentQuality = this.qualityLevels[1]; // High
    this.targetQuality = this.currentQuality;
    this.metrics = {
      currentLevel: this.currentQuality,
      targetLevel: this.targetQuality,
      performanceScore: 1.0,
      stabilityScore: 1.0,
      userExperienceScore: 1.0,
      adaptationReason: 'initial',
      lastAdaptation: Date.now()
    };
  }

  static getInstance(): ProgressiveQualityManager {
    if (!ProgressiveQualityManager.instance) {
      ProgressiveQualityManager.instance = new ProgressiveQualityManager();
    }
    return ProgressiveQualityManager.instance;
  }

  // --- PERFORMANCE MONITORING ---
  recordFrameTime(frameTime: number): void {
    this.performanceHistory.push(frameTime);
    
    // Maintain history length
    if (this.performanceHistory.length > this.maxHistoryLength) {
      this.performanceHistory.shift();
    }

    // Trigger adaptation check
    this.checkAdaptationNeeded();
  }

  // --- ADAPTATION LOGIC ---
  private checkAdaptationNeeded(): void {
    if (this.isAdapting) return;
    
    const now = Date.now();
    if (now - this.lastAdaptation < this.adaptationCooldown) return;

    const performanceScore = this.calculatePerformanceScore();
    const stabilityScore = this.calculateStabilityScore();
    const userExperienceScore = this.calculateUserExperienceScore();

    this.metrics.performanceScore = performanceScore;
    this.metrics.stabilityScore = stabilityScore;
    this.metrics.userExperienceScore = userExperienceScore;

    // Determine if adaptation is needed
    const shouldAdapt = this.shouldAdaptQuality(performanceScore, stabilityScore, userExperienceScore);
    
    if (shouldAdapt) {
      this.adaptQuality(performanceScore, stabilityScore, userExperienceScore);
    }
  }

  private calculatePerformanceScore(): number {
    if (this.performanceHistory.length < 10) return 1.0;

    const recentFrames = this.performanceHistory.slice(-30);
    const averageFrameTime = recentFrames.reduce((a, b) => a + b, 0) / recentFrames.length;
    const targetFrameTime = 1000 / this.currentQuality.frameRate;
    
    // Performance score based on frame time adherence
    const frameTimeScore = Math.min(1.0, targetFrameTime / averageFrameTime);
    
    // Memory pressure check
    let memoryScore = 1.0;
    if ('memory' in performance) {
      const mem = (performance as any).memory;
      const memoryPressure = mem.usedJSHeapSize / mem.jsHeapSizeLimit;
      memoryScore = Math.max(0, 1 - memoryPressure);
    }

    // Combine scores
    return (frameTimeScore * 0.6) + (memoryScore * 0.4);
  }

  private calculateStabilityScore(): number {
    if (this.performanceHistory.length < 30) return 1.0;

    const recentFrames = this.performanceHistory.slice(-30);
    const frameTimeVariance = this.calculateVariance(recentFrames);
    const averageFrameTime = recentFrames.reduce((a, b) => a + b, 0) / recentFrames.length;
    
    // Stability based on variance (lower variance = higher stability)
    const coefficientOfVariation = Math.sqrt(frameTimeVariance) / averageFrameTime;
    return Math.max(0, 1 - coefficientOfVariation);
  }

  private calculateUserExperienceScore(): number {
    // Combine performance and stability for user experience
    return (this.metrics.performanceScore * 0.7) + (this.metrics.stabilityScore * 0.3);
  }

  private shouldAdaptQuality(performanceScore: number, stabilityScore: number, userExperienceScore: number): boolean {
    // Adapt if user experience is poor
    if (userExperienceScore < 0.6) return true;
    
    // Adapt if performance is consistently poor
    if (performanceScore < 0.5 && stabilityScore < 0.7) return true;
    
    // Adapt if we can improve quality without hurting performance
    if (performanceScore > 0.9 && stabilityScore > 0.8 && this.canUpgradeQuality()) return true;
    
    return false;
  }

  private adaptQuality(performanceScore: number, stabilityScore: number, userExperienceScore: number): void {
    this.isAdapting = true;
    
    const currentIndex = this.qualityLevels.findIndex(q => q.name === this.currentQuality.name);
    let newIndex = currentIndex;
    let reason = '';

    if (userExperienceScore < 0.6 || performanceScore < 0.5) {
      // Downgrade quality
      newIndex = Math.max(0, currentIndex - 1);
      reason = 'performance-degradation';
    } else if (performanceScore > 0.9 && stabilityScore > 0.8 && this.canUpgradeQuality()) {
      // Upgrade quality
      newIndex = Math.min(this.qualityLevels.length - 1, currentIndex + 1);
      reason = 'performance-improvement';
    }

    if (newIndex !== currentIndex) {
      this.targetQuality = this.qualityLevels[newIndex];
      this.applyQualityChange(reason);
    }

    this.isAdapting = false;
  }

  private canUpgradeQuality(): boolean {
    const currentIndex = this.qualityLevels.findIndex(q => q.name === this.currentQuality.name);
    return currentIndex < this.qualityLevels.length - 1;
  }

  private applyQualityChange(reason: string): void {
    this.currentQuality = this.targetQuality;
    this.lastAdaptation = Date.now();
    
    this.metrics.currentLevel = this.currentQuality;
    this.metrics.targetLevel = this.targetQuality;
    this.metrics.adaptationReason = reason;
    this.metrics.lastAdaptation = this.lastAdaptation;

    logger.info(`[QualityManager] Quality adapted to ${this.currentQuality.name} (${reason})`);
    
    // Notify subscribers
    this.callbacks.forEach(callback => callback(this.currentQuality));
    
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('quality-change', {
      detail: {
        quality: this.currentQuality,
        reason,
        metrics: this.metrics
      }
    }));
  }

  // --- UTILITY METHODS ---
  private calculateVariance(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
  }

  // --- PUBLIC API ---
  getCurrentQuality(): QualityLevel {
    return this.currentQuality;
  }

  getMetrics(): QualityMetrics {
    return { ...this.metrics };
  }

  setQualityLevel(level: 'ultra' | 'high' | 'medium' | 'low' | 'minimal'): void {
    const quality = this.qualityLevels.find(q => q.name === level);
    if (quality) {
      this.targetQuality = quality;
      this.applyQualityChange('manual-override');
    }
  }

  subscribe(callback: (quality: QualityLevel) => void): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  // --- DEVICE CAPABILITY DETECTION ---
  detectDeviceCapabilities(): { gpuTier: number; cpuCores: number; memory: number } {
    const gpuTier = this.detectGPUTier();
    const cpuCores = navigator.hardwareConcurrency || 4;
    const memory = this.detectMemory();

    return { gpuTier, cpuCores, memory };
  }

  private detectGPUTier(): number {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext;
    
    if (!gl) return 1; // No WebGL
    
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (!debugInfo) return 2; // WebGL but no debug info
    
    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
    
    // Simple GPU tier detection based on renderer string
    if (renderer.includes('NVIDIA') || renderer.includes('RTX') || renderer.includes('GTX')) {
      return 4; // High-end NVIDIA
    } else if (renderer.includes('AMD') || renderer.includes('Radeon')) {
      return 3; // AMD
    } else if (renderer.includes('Intel')) {
      return 2; // Intel integrated
    } else if (renderer.includes('Mali') || renderer.includes('Adreno')) {
      return 2; // Mobile
    } else {
      return 1; // Unknown/low-end
    }
  }

  private detectMemory(): number {
    if ('memory' in performance) {
      const mem = (performance as any).memory;
      return mem.jsHeapSizeLimit;
    }
    return 4 * 1024 * 1024 * 1024; // 4GB fallback
  }

  // --- AUTO-OPTIMIZATION ---
  optimizeForDevice(): void {
    const capabilities = this.detectDeviceCapabilities();
    let recommendedLevel = 1; // Default to high

    if (capabilities.gpuTier <= 2 || capabilities.memory <= 2 * 1024 * 1024 * 1024) {
      recommendedLevel = 2; // Medium
    }
    
    if (capabilities.gpuTier === 1 || capabilities.memory <= 1 * 1024 * 1024 * 1024) {
      recommendedLevel = 3; // Low
    }

    const recommendedQuality = this.qualityLevels[recommendedLevel];
    this.setQualityLevel(recommendedQuality.name);
    
    logger.info(`[QualityManager] Auto-optimized for device: ${recommendedQuality.name}`);
  }
}

// Export singleton instance
export const qualityManager = ProgressiveQualityManager.getInstance();

// Hook for React components
export function useProgressiveQuality() {
  const [quality, setQuality] = React.useState<QualityLevel>(qualityManager.getCurrentQuality());
  const [metrics, setMetrics] = React.useState<QualityMetrics>(qualityManager.getMetrics());

  React.useEffect(() => {
    // Subscribe to quality changes
    const unsubscribe = qualityManager.subscribe((newQuality) => {
      setQuality(newQuality);
      setMetrics(qualityManager.getMetrics());
    });

    // Auto-optimize for device on mount
    qualityManager.optimizeForDevice();

    return () => {
      unsubscribe();
    };
  }, []);

  return {
    quality,
    metrics,
    setQualityLevel: qualityManager.setQualityLevel.bind(qualityManager),
    recordFrameTime: qualityManager.recordFrameTime.bind(qualityManager),
    getCurrentQuality: qualityManager.getCurrentQuality.bind(qualityManager),
    getMetrics: qualityManager.getMetrics.bind(qualityManager),
    optimizeForDevice: qualityManager.optimizeForDevice.bind(qualityManager)
  };
}
