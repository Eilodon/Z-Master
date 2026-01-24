// Enhanced Error Reporting - Concrete failure contexts
// Eidolon Principle: Transform abstract errors into concrete understanding

export interface ErrorContext {
  userId?: string;
  sessionId: string;
  timestamp: number;
  component: string;
  operation: string;
  userIntent?: string;
  systemState: {
    audioContext: AudioContextState | null;
    networkStatus: 'online' | 'offline' | 'unknown';
    memoryUsage?: MemoryInfo;
    batteryLevel?: number;
    deviceType: 'mobile' | 'desktop' | 'tablet' | 'unknown';
  };
  environmentalFactors: {
    userAgent: string;
    language: string;
    timezone: string;
    screenResolution: string;
    connectionType: string;
  };
  technicalDetails: {
    stackTrace?: string;
    errorType: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    recoverable: boolean;
    impact: 'ui' | 'audio' | 'crypto' | 'network' | 'state' | 'system';
  };
  userExperience: {
    wasUserInteracting: boolean;
    currentView: string;
    lastAction: string;
    sessionDuration: number;
  };
}

export interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

export type AudioContextState = 'suspended' | 'running' | 'closed' | 'interrupted' | 'unknown';

class EnhancedErrorReporter {
  private static instance: EnhancedErrorReporter;
  private errorQueue: ErrorContext[] = [];
  private maxQueueSize = 100;
  private sessionId: string;

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.setupGlobalErrorHandlers();
  }

  static getInstance(): EnhancedErrorReporter {
    if (!EnhancedErrorReporter.instance) {
      EnhancedErrorReporter.instance = new EnhancedErrorReporter();
    }
    return EnhancedErrorReporter.instance;
  }

  private generateSessionId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private setupGlobalErrorHandlers(): void {
    // Enhanced global error handlers with context
    window.addEventListener('error', (event) => {
      this.reportError({
        error: event.error,
        context: this.buildErrorContext('global_error', 'Unhandled JavaScript Error', {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        })
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.reportError({
        error: new Error(event.reason),
        context: this.buildErrorContext('unhandled_promise', 'Unhandled Promise Rejection', {
          reason: event.reason
        })
      });
    });
  }

  reportError(options: {
    error: Error | string;
    context: Partial<ErrorContext>;
    operation?: string;
    component?: string;
  }): void {
    const errorContext = this.buildErrorContext(
      options.component || 'unknown',
      options.operation || 'unknown_operation',
      options.context
    );

    errorContext.technicalDetails = {
      ...errorContext.technicalDetails,
      stackTrace: options.error instanceof Error ? options.error.stack : undefined,
      errorType: options.error instanceof Error ? options.error.constructor.name : 'StringError',
      severity: this.determineSeverity(options.error),
      recoverable: this.isRecoverable(options.error),
      impact: this.determineImpact(options.error)
    };

    this.queueError(errorContext);
    this.processError(errorContext);
  }

  private buildErrorContext(
    component: string,
    operation: string,
    additionalContext?: any
  ): ErrorContext {
    return {
      sessionId: this.sessionId,
      timestamp: Date.now(),
      component,
      operation,
      systemState: this.getSystemState(),
      environmentalFactors: this.getEnvironmentalFactors(),
      technicalDetails: {
        errorType: 'unknown',
        severity: 'medium',
        recoverable: true,
        impact: 'system'
      },
      userExperience: this.getUserExperience(),
      ...additionalContext
    };
  }

  private getSystemState(): ErrorContext['systemState'] {
    const audioContext = this.getAudioContextState();
    const memoryInfo = this.getMemoryInfo();
    
    return {
      audioContext,
      networkStatus: this.getNetworkStatus(),
      memoryUsage: memoryInfo,
      batteryLevel: this.getBatteryLevel(),
      deviceType: this.getDeviceType()
    };
  }

  private getAudioContextState(): AudioContextState | null {
    try {
      // Try to get audio context state if available
      const audioContext = (window as any).audioContext;
      if (audioContext) {
        return audioContext.state || 'unknown';
      }
    } catch (e) {
      // Audio context not available
    }
    return null;
  }

  private getMemoryInfo(): MemoryInfo | undefined {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit
      };
    }
    return undefined;
  }

  private getNetworkStatus(): 'online' | 'offline' | 'unknown' {
    return navigator.onLine ? 'online' : 'offline';
  }

  private getBatteryLevel(): number | undefined {
    try {
      // Battery API is not widely supported
      return (navigator as any).battery?.level;
    } catch (e) {
      return undefined;
    }
  }

  private getDeviceType(): 'mobile' | 'desktop' | 'tablet' | 'unknown' {
    const userAgent = navigator.userAgent.toLowerCase();
    if (/mobile|android|iphone|ipod/.test(userAgent)) return 'mobile';
    if (/tablet|ipad/.test(userAgent)) return 'tablet';
    if (/desktop/.test(userAgent)) return 'desktop';
    return 'unknown';
  }

  private getEnvironmentalFactors(): ErrorContext['environmentalFactors'] {
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screenResolution: `${screen.width}x${screen.height}`,
      connectionType: this.getConnectionType()
    };
  }

  private getConnectionType(): string {
    try {
      const connection = (navigator as any).connection;
      return connection ? `${connection.effectiveType || 'unknown'} (${connection.downlink || 'unknown'}Mbps)` : 'unknown';
    } catch (e) {
      return 'unknown';
    }
  }

  private getUserExperience(): ErrorContext['userExperience'] {
    // This would need to be integrated with the app's state management
    return {
      wasUserInteracting: true, // Simplified - would need actual tracking
      currentView: 'main', // Simplified - would need actual routing state
      lastAction: 'unknown', // Simplified - would need actual user action tracking
      sessionDuration: Date.now() - (window as any).sessionStart || Date.now()
    };
  }

  private determineSeverity(error: Error | string): 'low' | 'medium' | 'high' | 'critical' {
    const errorStr = error instanceof Error ? error.message : error;
    
    // Critical errors that prevent core functionality
    if (errorStr.includes('Permission denied') || 
        errorStr.includes('SecurityError') ||
        errorStr.includes('QuotaExceededError') ||
        errorStr.includes('OutOfMemoryError')) {
      return 'critical';
    }
    
    // High severity errors that impact user experience
    if (errorStr.includes('NetworkError') ||
        errorStr.includes('TimeoutError') ||
        errorStr.includes('AudioContext') ||
        errorStr.includes('CryptoError')) {
      return 'high';
    }
    
    // Medium severity errors that are recoverable
    if (errorStr.includes('TypeError') ||
        errorStr.includes('ReferenceError') ||
        errorStr.includes('RangeError')) {
      return 'medium';
    }
    
    return 'low';
  }

  private isRecoverable(error: Error | string): boolean {
    const errorStr = error instanceof Error ? error.message : error;
    
    // Some errors are not recoverable without user intervention
    if (errorStr.includes('Permission denied') ||
        errorStr.includes('SecurityError') ||
        errorStr.includes('QuotaExceededError')) {
      return false;
    }
    
    return true;
  }

  private determineImpact(error: Error | string): 'ui' | 'audio' | 'crypto' | 'network' | 'state' | 'system' {
    const errorStr = error instanceof Error ? error.message : error;
    
    if (errorStr.includes('AudioContext') || errorStr.includes('audio')) return 'audio';
    if (errorStr.includes('Crypto') || errorStr.includes('encrypt') || errorStr.includes('decrypt')) return 'crypto';
    if (errorStr.includes('Network') || errorStr.includes('fetch') || errorStr.includes('XMLHttpRequest')) return 'network';
    if (errorStr.includes('state') || errorStr.includes('transition')) return 'state';
    if (errorStr.includes('DOM') || errorStr.includes('render')) return 'ui';
    
    return 'system';
  }

  private queueError(errorContext: ErrorContext): void {
    this.errorQueue.push(errorContext);
    
    // Maintain queue size
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift();
    }
  }

  private processError(errorContext: ErrorContext): void {
    // Log detailed error information
    console.group(`🚨 Enhanced Error Report [${errorContext.technicalDetails.severity.toUpperCase()}]`);
    console.error('Component:', errorContext.component);
    console.error('Operation:', errorContext.operation);
    console.error('Error Type:', errorContext.technicalDetails.errorType);
    console.error('Impact:', errorContext.technicalDetails.impact);
    console.error('Recoverable:', errorContext.technicalDetails.recoverable);
    console.error('System State:', errorContext.systemState);
    console.error('User Experience:', errorContext.userExperience);
    console.groupEnd();

    // Send to external monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoringService(errorContext);
    }
  }

  private async sendToMonitoringService(errorContext: ErrorContext): Promise<void> {
    try {
      // In a real implementation, this would send to a service like Sentry, LogRocket, etc.
      console.log('[EnhancedErrorReporter] Would send to monitoring service:', errorContext);
    } catch (e) {
      console.error('[EnhancedErrorReporter] Failed to send to monitoring service:', e);
    }
  }

  // Public API for manual error reporting
  reportComponentError(component: string, operation: string, error: Error, additionalContext?: any): void {
    this.reportError({
      error,
      component,
      operation,
      context: additionalContext
    });
  }

  reportAudioError(operation: string, error: Error, audioContext?: AudioContext): void {
    this.reportError({
      error,
      component: 'AudioEngine',
      operation,
      context: {
        systemState: {
          audioContext: audioContext?.state || 'unknown',
          networkStatus: this.getNetworkStatus(),
          deviceType: this.getDeviceType()
        }
      }
    });
  }

  reportCryptoError(operation: string, error: Error): void {
    this.reportError({
      error,
      component: 'VaultService',
      operation,
      context: {
        technicalDetails: {
          errorType: error.constructor.name,
          severity: 'critical' as const,
          recoverable: false,
          impact: 'crypto' as const
        }
      }
    });
  }

  // Error analysis and insights
  getErrorSummary(): {
    totalErrors: number;
    errorsBySeverity: Record<string, number>;
    errorsByComponent: Record<string, number>;
    errorsByImpact: Record<string, number>;
    recentErrors: ErrorContext[];
  } {
    const errorsBySeverity: Record<string, number> = {};
    const errorsByComponent: Record<string, number> = {};
    const errorsByImpact: Record<string, number> = {};

    for (const error of this.errorQueue) {
      errorsBySeverity[error.technicalDetails.severity] = (errorsBySeverity[error.technicalDetails.severity] || 0) + 1;
      errorsByComponent[error.component] = (errorsByComponent[error.component] || 0) + 1;
      errorsByImpact[error.technicalDetails.impact] = (errorsByImpact[error.technicalDetails.impact] || 0) + 1;
    }

    return {
      totalErrors: this.errorQueue.length,
      errorsBySeverity,
      errorsByComponent,
      errorsByImpact,
      recentErrors: this.errorQueue.slice(-10) // Last 10 errors
    };
  }

  clearErrorQueue(): void {
    this.errorQueue = [];
  }
}

export const enhancedErrorReporter = EnhancedErrorReporter.getInstance();

// Convenience exports
export const reportError = (component: string, operation: string, error: Error, context?: any) => 
  enhancedErrorReporter.reportComponentError(component, operation, error, context);

export const reportAudioError = (operation: string, error: Error, audioContext?: AudioContext) => 
  enhancedErrorReporter.reportAudioError(operation, error, audioContext);

export const reportCryptoError = (operation: string, error: Error) => 
  enhancedErrorReporter.reportCryptoError(operation, error);
