// --- EXTREME ERROR BOUNDARY SYSTEM ---
// Implements Netflix-style Hystrix circuit breaker + React Error Boundary patterns
// Granular error isolation with automatic recovery and monitoring

import * as React from 'react';
import { AlertTriangle, RefreshCw, Bug, Zap } from 'lucide-react';

// Error severity classification
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

// Error context for better debugging
export interface ErrorContext {
  componentStack: string;
  errorBoundary: string;
  timestamp: number;
  userAgent: string;
  url: string;
  severity: ErrorSeverity;
  recoverable: boolean;
}

// Circuit breaker state
interface CircuitBreakerState {
  isOpen: boolean;
  failureCount: number;
  lastFailureTime: number;
  nextAttemptTime: number;
}

// Enhanced error with context
export class EnhancedError extends Error {
  public readonly context: ErrorContext;
  public readonly originalError: Error;

  constructor(message: string, originalError: Error, context: Partial<ErrorContext>) {
    super(message);
    this.originalError = originalError;
    this.context = {
      componentStack: '',
      errorBoundary: 'Unknown',
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      severity: 'medium',
      recoverable: true,
      ...context
    };
  }
}

// Extreme error boundary with circuit breaker
interface ExtremeErrorBoundaryState {
  hasError: boolean;
  error: EnhancedError | null;
  errorInfo: React.ErrorInfo | null;
  circuitBreaker: CircuitBreakerState;
  retryCount: number;
  isRecovering: boolean;
}

interface ExtremeErrorBoundaryProps {
  children: React.ReactNode;
  name: string;
  fallback?: React.ComponentType<{ error: EnhancedError; retry: () => void; circuitBreaker: CircuitBreakerState }>;
  onError?: (error: EnhancedError, errorInfo: React.ErrorInfo) => void;
  maxRetries?: number;
  circuitBreakerThreshold?: number;
  recoveryTimeout?: number;
  severity?: ErrorSeverity;
}

export class ExtremeErrorBoundary extends React.Component<ExtremeErrorBoundaryProps, ExtremeErrorBoundaryState> {
  private static errorCounts = new Map<string, number>();
  private static globalErrorLog: Array<{ error: EnhancedError; timestamp: number }> = [];

  constructor(props: ExtremeErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      circuitBreaker: {
        isOpen: false,
        failureCount: 0,
        lastFailureTime: 0,
        nextAttemptTime: 0
      },
      retryCount: 0,
      isRecovering: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ExtremeErrorBoundaryState> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const enhancedError = new EnhancedError(error.message, error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: this.props.name,
      severity: this.props.severity || 'medium',
      recoverable: this.isRecoverable(error)
    });

    // Update circuit breaker
    const newCircuitBreakerState = this.updateCircuitBreaker();

    // Log error globally
    ExtremeErrorBoundary.logError(enhancedError);

    // Update error counts
    const currentCount = ExtremeErrorBoundary.errorCounts.get(this.props.name) || 0;
    ExtremeErrorBoundary.errorCounts.set(this.props.name, currentCount + 1);

    // Call custom error handler
    this.props.onError?.(enhancedError, errorInfo);

    this.setState({
      error: enhancedError,
      errorInfo,
      circuitBreaker: newCircuitBreakerState
    });

    // Schedule automatic recovery if recoverable
    if (enhancedError.context.recoverable && !newCircuitBreakerState.isOpen) {
      this.scheduleAutoRecovery();
    }
  }

  private isRecoverable(error: Error): boolean {
    // Classify error types
    const recoverablePatterns = [
      /NetworkError/i,
      /Timeout/i,
      /Permission/i,
      /ChunkLoadError/i,
      /Loading.*failed/i
    ];

    const criticalPatterns = [
      /TypeError.*cannot read/i,
      /ReferenceError.*not defined/i,
      /SyntaxError/i,
      /RangeError/i
    ];

    const errorMessage = error.message;

    if (criticalPatterns.some(pattern => pattern.test(errorMessage))) {
      return false;
    }

    if (recoverablePatterns.some(pattern => pattern.test(errorMessage))) {
      return true;
    }

    // Default to recoverable for unknown errors
    return true;
  }

  private updateCircuitBreaker(): CircuitBreakerState {
    const threshold = this.props.circuitBreakerThreshold || 5;
    const timeout = this.props.recoveryTimeout || 30000; // 30 seconds

    const newState = { ...this.state.circuitBreaker };
    newState.failureCount++;
    newState.lastFailureTime = Date.now();

    // Open circuit breaker if threshold exceeded
    if (newState.failureCount >= threshold) {
      newState.isOpen = true;
      newState.nextAttemptTime = Date.now() + timeout;
      console.warn(`[ErrorBoundary] Circuit breaker opened for ${this.props.name}`);
    }

    return newState;
  }

  private static logError(error: EnhancedError): void {
    // Add to global error log
    ExtremeErrorBoundary.globalErrorLog.push({
      error,
      timestamp: Date.now()
    });

    // Keep only last 100 errors
    if (ExtremeErrorBoundary.globalErrorLog.length > 100) {
      ExtremeErrorBoundary.globalErrorLog = ExtremeErrorBoundary.globalErrorLog.slice(-100);
    }

    // Console error with context
    console.group(`🔥 [${error.context.severity.toUpperCase()}] ${error.context.errorBoundary}`);
    console.error('Message:', error.message);
    console.error('Context:', error.context);
    console.error('Stack:', error.stack);
    console.groupEnd();

    // In production, send to error reporting service
    if (process.env.NODE_ENV === 'production') {
      // TODO: Implement error reporting service integration
      console.warn('[ErrorBoundary] Production error reporting not implemented');
    }
  }

  private scheduleAutoRecovery(): void {
    const timeout = this.props.recoveryTimeout || 30000;
    setTimeout(() => {
      if (this.state.error?.context.recoverable) {
        this.attemptRecovery();
      }
    }, timeout);
  }

  private attemptRecovery = (): void => {
    const maxRetries = this.props.maxRetries || 3;
    
    if (this.state.retryCount >= maxRetries) {
      console.warn(`[ErrorBoundary] Max retries exceeded for ${this.props.name}`);
      return;
    }

    // Check if circuit breaker allows recovery
    if (this.state.circuitBreaker.isOpen && Date.now() < this.state.circuitBreaker.nextAttemptTime) {
      console.log(`[ErrorBoundary] Circuit breaker still open for ${this.props.name}`);
      return;
    }

    this.setState({ isRecovering: true });

    // Attempt recovery
    setTimeout(() => {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1,
        isRecovering: false,
        circuitBreaker: {
          ...prevState.circuitBreaker,
          isOpen: false,
          failureCount: 0
        }
      }));
    }, 1000);
  };

  private resetCircuitBreaker = (): void => {
    this.setState({
      circuitBreaker: {
        isOpen: false,
        failureCount: 0,
        lastFailureTime: 0,
        nextAttemptTime: 0
      },
      retryCount: 0
    });
  };

  // Static methods for global error management
  static getErrorStats(): Record<string, number> {
    return Object.fromEntries(ExtremeErrorBoundary.errorCounts);
  }

  static getRecentErrors(): Array<{ error: EnhancedError; timestamp: number }> {
    return ExtremeErrorBoundary.globalErrorLog.slice(-10);
  }

  static clearErrorStats(): void {
    ExtremeErrorBoundary.errorCounts.clear();
    ExtremeErrorBoundary.globalErrorLog = [];
  }

  render() {
    if (this.state.hasError && this.state.error) {
      // Custom fallback component
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent 
            error={this.state.error} 
            retry={this.attemptRecovery}
            circuitBreaker={this.state.circuitBreaker}
          />
        );
      }

      // Default fallback UI
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex flex-col items-center justify-center p-8 text-center">
          <div className="max-w-md w-full space-y-6">
            {/* Error Icon */}
            <div className="flex justify-center">
              <div className="p-4 bg-red-100 rounded-full">
                <AlertTriangle className="w-12 h-12 text-red-600" />
              </div>
            </div>

            {/* Error Message */}
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-stone-800">
                {this.state.error.context.severity === 'critical' ? 'Critical Error' : 'Something went wrong'}
              </h1>
              <p className="text-stone-600 text-sm">
                {this.state.error.context.recoverable 
                  ? 'Attempting to recover automatically...' 
                  : 'Please refresh the page to continue.'
                }
              </p>
            </div>

            {/* Circuit Breaker Status */}
            {this.state.circuitBreaker.isOpen && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-yellow-800 text-sm">
                  <Zap className="w-4 h-4" />
                  <span>Circuit breaker is active</span>
                </div>
              </div>
            )}

            {/* Recovery Actions */}
            <div className="space-y-3">
              {this.state.error.context.recoverable && (
                <button
                  onClick={this.attemptRecovery}
                  disabled={this.state.isRecovering || this.state.circuitBreaker.isOpen}
                  className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {this.state.isRecovering ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Recovering...
                    </>
                  ) : (
                    <>
                      <RefreshCw size={16} />
                      Try Again ({this.state.retryCount}/{this.props.maxRetries || 3})
                    </>
                  )}
                </button>
              )}

              <button
                onClick={() => window.location.reload()}
                className="w-full px-4 py-2 bg-stone-600 text-white rounded-lg font-medium hover:bg-stone-700 transition-colors"
              >
                Reload Page
              </button>
            </div>

            {/* Error Details (Development Only) */}
            {process.env.NODE_ENV === 'development' && (
              <details className="text-left">
                <summary className="cursor-pointer text-sm text-stone-500 hover:text-stone-700">
                  Error Details
                </summary>
                <div className="mt-2 p-3 bg-stone-100 rounded text-xs font-mono text-stone-700 max-h-32 overflow-auto">
                  <div><strong>Error:</strong> {this.state.error.message}</div>
                  <div><strong>Boundary:</strong> {this.state.error.context.errorBoundary}</div>
                  <div><strong>Severity:</strong> {this.state.error.context.severity}</div>
                  <div><strong>Recoverable:</strong> {this.state.error.context.recoverable ? 'Yes' : 'No'}</div>
                  <div><strong>Failures:</strong> {this.state.circuitBreaker.failureCount}</div>
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for global error monitoring
export function useErrorMonitoring() {
  const [errorStats, setErrorStats] = React.useState<Record<string, number>>({});
  const [recentErrors, setRecentErrors] = React.useState<Array<{ error: EnhancedError; timestamp: number }>>([]);

  React.useEffect(() => {
    const updateStats = () => {
      setErrorStats(ExtremeErrorBoundary.getErrorStats());
      setRecentErrors(ExtremeErrorBoundary.getRecentErrors());
    };

    const interval = setInterval(updateStats, 5000);
    updateStats();

    return () => clearInterval(interval);
  }, []);

  return {
    errorStats,
    recentErrors,
    clearErrors: ExtremeErrorBoundary.clearErrorStats
  };
}
