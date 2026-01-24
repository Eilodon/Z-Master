// Circuit Breaker Pattern Implementation
// Prevents cascade failures and provides graceful degradation

import * as React from 'react';

export enum CircuitState {
  CLOSED = 'closed',     // Normal operation
  OPEN = 'open',         // Failing, reject calls
  HALF_OPEN = 'half-open' // Testing if service recovered
}

export interface CircuitBreakerConfig {
  failureThreshold: number;    // Number of failures before opening
  resetTimeout: number;        // Time in ms to wait before trying half-open
  monitoringPeriod: number;    // Time window to count failures
  expectedRecoveryTime?: number; // Expected time for service to recover
}

export interface CircuitBreakerStats {
  state: CircuitState;
  failures: number;
  successes: number;
  totalRequests: number;
  lastFailureTime?: number;
  nextAttemptTime?: number;
}

class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failures = 0;
  private successes = 0;
  private totalRequests = 0;
  private lastFailureTime?: number;
  private nextAttemptTime?: number;
  private failureHistory: number[] = []; // Timestamps of recent failures

  constructor(private config: CircuitBreakerConfig) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    this.totalRequests++;

    // Check if circuit is open
    if (this.state === CircuitState.OPEN) {
      if (Date.now() >= this.nextAttemptTime!) {
        this.state = CircuitState.HALF_OPEN;
      } else {
        throw new Error('Circuit breaker is OPEN - service unavailable');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.successes++;
    
    if (this.state === CircuitState.HALF_OPEN) {
      // Service recovered, close the circuit
      this.state = CircuitState.CLOSED;
      this.failures = 0;
      this.failureHistory = [];
      console.log('[CircuitBreaker] Service recovered, circuit CLOSED');
    }
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    this.failureHistory.push(Date.now());

    // Clean old failures outside monitoring period
    const cutoff = Date.now() - this.config.monitoringPeriod;
    this.failureHistory = this.failureHistory.filter(time => time > cutoff);

    // Check if we should open the circuit
    if (this.failureHistory.length >= this.config.failureThreshold) {
      this.state = CircuitState.OPEN;
      this.nextAttemptTime = Date.now() + this.config.resetTimeout;
      console.warn(`[CircuitBreaker] Circuit OPEN due to ${this.failureHistory.length} failures`);
    }
  }

  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      totalRequests: this.totalRequests,
      lastFailureTime: this.lastFailureTime,
      nextAttemptTime: this.nextAttemptTime
    };
  }

  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failures = 0;
    this.successes = 0;
    this.totalRequests = 0;
    this.lastFailureTime = undefined;
    this.nextAttemptTime = undefined;
    this.failureHistory = [];
    console.log('[CircuitBreaker] Circuit manually reset');
  }

  forceOpen(): void {
    this.state = CircuitState.OPEN;
    this.nextAttemptTime = Date.now() + this.config.resetTimeout;
    console.warn('[CircuitBreaker] Circuit manually forced OPEN');
  }
}

// Circuit Breaker Registry for managing multiple breakers
class CircuitBreakerRegistry {
  private static instance: CircuitBreakerRegistry;
  private breakers = new Map<string, CircuitBreaker>();

  static getInstance(): CircuitBreakerRegistry {
    if (!CircuitBreakerRegistry.instance) {
      CircuitBreakerRegistry.instance = new CircuitBreakerRegistry();
    }
    return CircuitBreakerRegistry.instance;
  }

  register(name: string, config: CircuitBreakerConfig): CircuitBreaker {
    const breaker = new CircuitBreaker(config);
    this.breakers.set(name, breaker);
    return breaker;
  }

  get(name: string): CircuitBreaker | undefined {
    return this.breakers.get(name);
  }

  getAllStats(): Record<string, CircuitBreakerStats> {
    const stats: Record<string, CircuitBreakerStats> = {};
    for (const [name, breaker] of this.breakers) {
      stats[name] = breaker.getStats();
    }
    return stats;
  }

  resetAll(): void {
    for (const breaker of this.breakers.values()) {
      breaker.reset();
    }
  }
}

// Pre-configured circuit breakers for common services
export const circuitBreakerRegistry = CircuitBreakerRegistry.getInstance();

// Gemini API Circuit Breaker
circuitBreakerRegistry.register('gemini-api', {
  failureThreshold: 3,
  resetTimeout: 60000, // 1 minute
  monitoringPeriod: 300000, // 5 minutes
  expectedRecoveryTime: 30000 // 30 seconds
});

// Database Circuit Breaker
circuitBreakerRegistry.register('database', {
  failureThreshold: 5,
  resetTimeout: 30000, // 30 seconds
  monitoringPeriod: 60000, // 1 minute
  expectedRecoveryTime: 10000 // 10 seconds
});

// Network Request Circuit Breaker
circuitBreakerRegistry.register('network', {
  failureThreshold: 4,
  resetTimeout: 45000, // 45 seconds
  monitoringPeriod: 180000, // 3 minutes
  expectedRecoveryTime: 15000 // 15 seconds
});

// Higher-order function for wrapping API calls
export function withCircuitBreaker<T>(
  breakerName: string,
  operation: () => Promise<T>
): Promise<T> {
  const breaker = circuitBreakerRegistry.get(breakerName);
  if (!breaker) {
    console.warn(`[CircuitBreaker] No breaker found for '${breakerName}', executing without protection`);
    return operation();
  }
  return breaker.execute(operation);
}

// React hook for circuit breaker status
export function useCircuitBreakerStatus(breakerName: string) {
  const [stats, setStats] = React.useState<CircuitBreakerStats | null>(null);

  React.useEffect(() => {
    const updateStats = () => {
      const breaker = circuitBreakerRegistry.get(breakerName);
      if (breaker) {
        setStats(breaker.getStats());
      }
    };

    updateStats();
    const interval = setInterval(updateStats, 1000); // Update every second

    return () => clearInterval(interval);
  }, [breakerName]);

  return stats;
}

// Export for testing
export { CircuitBreaker };
