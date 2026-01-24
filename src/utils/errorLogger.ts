// Comprehensive Error Logging System
// Provides structured, secure error reporting with performance monitoring

export interface ErrorLog {
  timestamp: number;
  level: 'error' | 'warn' | 'info' | 'debug';
  category: 'audio' | 'crypto' | 'network' | 'state' | 'ui' | 'api' | 'system' | 'performance';
  message: string;
  context?: Record<string, any>;
  stack?: string;
  userId?: string;
  sessionId: string;
}

class ErrorLogger {
  private static instance: ErrorLogger;
  private sessionId: string;
  private logs: ErrorLog[] = [];
  private maxLogs = 1000; // Prevent memory leaks
  private isDevelopment = process.env.NODE_ENV === 'development';

  private constructor() {
    this.sessionId = this.generateSessionId();
    
    // Set up global error handlers
    if (typeof window !== 'undefined') {
      window.addEventListener('error', this.handleGlobalError.bind(this));
      window.addEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this));
    }
  }

  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  private generateSessionId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private handleGlobalError(event: ErrorEvent) {
    this.log({
      level: 'error',
      category: 'system',
      message: event.message,
      context: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      },
      stack: event.error?.stack
    });
  }

  private handleUnhandledRejection(event: PromiseRejectionEvent) {
    this.log({
      level: 'error',
      category: 'system',
      message: 'Unhandled Promise Rejection',
      context: {
        reason: event.reason
      },
      stack: event.reason?.stack
    });
  }

  log(entry: Omit<ErrorLog, 'timestamp' | 'sessionId'>): void {
    const logEntry: ErrorLog = {
      timestamp: Date.now(),
      sessionId: this.sessionId,
      ...entry
    };

    // Add to internal logs
    this.logs.push(logEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Console output in development
    if (this.isDevelopment) {
      const consoleMethod = entry.level === 'error' ? 'error' :
                          entry.level === 'warn' ? 'warn' :
                          entry.level === 'info' ? 'info' : 'debug';
      
      console[consoleMethod](`[${entry.category.toUpperCase()}] ${entry.message}`, 
        entry.context || '', 
        entry.stack || '');
    }

    // In production, send to logging service
    if (!this.isDevelopment && entry.level === 'error') {
      this.sendToLoggingService(logEntry);
    }
  }

  error(category: ErrorLog['category'], message: string, context?: Record<string, any>, error?: Error): void {
    this.log({
      level: 'error',
      category,
      message,
      context,
      stack: error?.stack
    });
  }

  warn(category: ErrorLog['category'], message: string, context?: Record<string, any>): void {
    this.log({
      level: 'warn',
      category,
      message,
      context
    });
  }

  info(category: ErrorLog['category'], message: string, context?: Record<string, any>): void {
    this.log({
      level: 'info',
      category,
      message,
      context
    });
  }

  debug(category: ErrorLog['category'], message: string, context?: Record<string, any>): void {
    this.log({
      level: 'debug',
      category,
      message,
      context
    });
  }

  private async sendToLoggingService(log: ErrorLog): Promise<void> {
    try {
      // In a real implementation, send to secure logging endpoint
      // For now, we'll just store it locally
      console.warn('[ErrorLogger] Production logging not implemented:', log);
    } catch (error) {
      console.error('[ErrorLogger] Failed to send log to service:', error);
    }
  }

  getLogs(category?: ErrorLog['category'], level?: ErrorLog['level']): ErrorLog[] {
    return this.logs.filter(log => {
      if (category && log.category !== category) return false;
      if (level && log.level !== level) return false;
      return true;
    });
  }

  clearLogs(): void {
    this.logs = [];
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  // Performance monitoring
  startTimer(label: string): () => void {
    const startTime = performance.now();
    
    return () => {
      const duration = performance.now() - startTime;
      this.debug('performance', `Timer: ${label}`, { duration: `${duration.toFixed(2)}ms` });
    };
  }

  // Memory monitoring
  logMemoryUsage(context?: string): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.debug('performance', 'Memory Usage', {
        context: context || 'general',
        used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
        total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
        limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)}MB`
      });
    }
  }
}

export const errorLogger = ErrorLogger.getInstance();

// Convenience exports
export const logError = (category: ErrorLog['category'], message: string, context?: Record<string, any>, error?: Error) => 
  errorLogger.error(category, message, context, error);

export const logWarn = (category: ErrorLog['category'], message: string, context?: Record<string, any>) => 
  errorLogger.warn(category, message, context);

export const logInfo = (category: ErrorLog['category'], message: string, context?: Record<string, any>) => 
  errorLogger.info(category, message, context);

export const logDebug = (category: ErrorLog['category'], message: string, context?: Record<string, any>) => 
  errorLogger.debug(category, message, context);

export const startTimer = (label: string) => errorLogger.startTimer(label);
export const logMemoryUsage = (context?: string) => errorLogger.logMemoryUsage(context);
