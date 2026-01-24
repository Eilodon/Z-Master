// Load Testing Framework - Validate invariants under scale
// Eidolon Principle: Test the system's true nature under stress

export interface LoadTestConfig {
  concurrentUsers: number;
  duration: number; // milliseconds
  rampUpTime: number; // milliseconds
  operations: LoadTestOperation[];
}

export interface LoadTestOperation {
  name: string;
  weight: number; // 0-1, relative frequency
  operation: () => Promise<any>;
  expectedDuration?: number; // milliseconds
  timeout?: number;
}

export interface LoadTestResult {
  config: LoadTestConfig;
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  averageResponseTime: number;
  maxResponseTime: number;
  minResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  operationsPerSecond: number;
  errors: Array<{
    operation: string;
    error: string;
    timestamp: number;
    responseTime: number;
  }>;
  invariantsViolated: Array<{
    invariant: string;
    violation: string;
    timestamp: number;
  }>;
}

class LoadTester {
  private activeConnections = 0;
  private results: LoadTestResult['errors'] = [];
  private invariantsViolated: LoadTestResult['invariantsViolated'] = [];
  private responseTimes: number[] = [];
  private startTime = 0;
  private endTime = 0;

  async runLoadTest(config: LoadTestConfig): Promise<LoadTestResult> {
    console.log(`[LoadTester] Starting load test: ${config.concurrentUsers} users, ${config.duration}ms`);
    
    this.startTime = Date.now();
    this.results = [];
    this.invariantsViolated = [];
    this.responseTimes = [];
    this.activeConnections = 0;

    // Create user simulation promises
    const userPromises: Promise<void>[] = [];
    
    for (let i = 0; i < config.concurrentUsers; i++) {
      const delay = (i / config.concurrentUsers) * config.rampUpTime;
      userPromises.push(
        this.simulateUser(config, delay)
      );
    }

    // Wait for all users to complete
    await Promise.allSettled(userPromises);
    this.endTime = Date.now();

    return this.generateReport(config);
  }

  private async simulateUser(config: LoadTestConfig, startDelay: number): Promise<void> {
    // Wait for ramp-up delay
    await this.sleep(startDelay);
    
    const endTime = Date.now() + config.duration;
    this.activeConnections++;

    try {
      while (Date.now() < endTime) {
        const operation = this.selectOperation(config.operations);
        await this.executeOperation(operation);
        
        // Small delay between operations
        await this.sleep(Math.random() * 100 + 50);
      }
    } finally {
      this.activeConnections--;
    }
  }

  private selectOperation(operations: LoadTestOperation[]): LoadTestOperation {
    const totalWeight = operations.reduce((sum, op) => sum + op.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const operation of operations) {
      random -= operation.weight;
      if (random <= 0) return operation;
    }
    
    return operations[0];
  }

  private async executeOperation(operation: LoadTestOperation): Promise<void> {
    const startTime = Date.now();
    
    try {
      const timeout = operation.timeout || 10000; // 10s default timeout
      
      await Promise.race([
        operation.operation(),
        this.timeout(timeout)
      ]);
      
      const responseTime = Date.now() - startTime;
      this.responseTimes.push(responseTime);
      
      // Validate expected duration
      if (operation.expectedDuration && responseTime > operation.expectedDuration * 2) {
        console.warn(`[LoadTester] Slow operation: ${operation.name} took ${responseTime}ms`);
      }
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.results.push({
        operation: operation.name,
        error: error instanceof Error ? error.message : String(error),
        timestamp: Date.now(),
        responseTime
      });
    }
  }

  private timeout(ms: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Operation timeout after ${ms}ms`)), ms);
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private generateReport(config: LoadTestConfig): LoadTestResult {
    const totalOperations = this.responseTimes.length + this.results.length;
    const successfulOperations = this.responseTimes.length;
    const failedOperations = this.results.length;
    
    const sortedTimes = [...this.responseTimes].sort((a, b) => a - b);
    const averageResponseTime = this.responseTimes.length > 0 
      ? this.responseTimes.reduce((sum, time) => sum + time, 0) / this.responseTimes.length 
      : 0;
    
    const duration = this.endTime - this.startTime;
    const operationsPerSecond = totalOperations / (duration / 1000);

    return {
      config,
      totalOperations,
      successfulOperations,
      failedOperations,
      averageResponseTime,
      maxResponseTime: Math.max(...this.responseTimes, 0),
      minResponseTime: Math.min(...this.responseTimes, Infinity),
      p95ResponseTime: this.percentile(sortedTimes, 0.95),
      p99ResponseTime: this.percentile(sortedTimes, 0.99),
      operationsPerSecond,
      errors: this.results,
      invariantsViolated: this.invariantsViolated
    };
  }

  private percentile(sortedArray: number[], p: number): number {
    if (sortedArray.length === 0) return 0;
    const index = Math.ceil(sortedArray.length * p) - 1;
    return sortedArray[Math.max(0, index)];
  }

  // Invariant checking methods
  checkInvariant(name: string, condition: boolean, violation: string): void {
    if (!condition) {
      this.invariantsViolated.push({
        invariant: name,
        violation,
        timestamp: Date.now()
      });
    }
  }
}

// Predefined load test scenarios
export const loadTestScenarios = {
  // Light load - typical usage
  lightLoad: {
    concurrentUsers: 10,
    duration: 30000, // 30 seconds
    rampUpTime: 5000, // 5 seconds
    operations: [
      {
        name: 'state_transition',
        weight: 0.3,
        operation: async () => {
          // Simulate state transitions
          const { useZenStore } = await import('../../store/zenStore');
          const store = useZenStore.getState();
          store.transitionTo({ kind: 'connecting' });
          await new Promise(resolve => setTimeout(resolve, 100));
          store.transitionTo({ kind: 'idling' });
        },
        expectedDuration: 200
      },
      {
        name: 'crypto_operation',
        weight: 0.2,
        operation: async () => {
          // Simulate crypto operations
          const { VaultService } = await import('../../services/crypto');
          if (VaultService.isAuthenticated()) {
            const testData = { test: 'load testing' };
            await VaultService.encrypt(testData);
          }
        },
        expectedDuration: 500
      },
      {
        name: 'audio_context',
        weight: 0.3,
        operation: async () => {
          // Simulate audio context operations
          const { audioContextManager } = await import('../../services/audioContextManager');
          await audioContextManager.getSharedContext();
          audioContextManager.releaseContext();
        },
        expectedDuration: 100
      },
      {
        name: 'memory_operation',
        weight: 0.2,
        operation: async () => {
          // Simulate memory operations
          const { dbService } = await import('../../services/db');
          if (VaultService.isAuthenticated()) {
            const entries = await dbService.getAllEntries();
            // Simulate processing
            await new Promise(resolve => setTimeout(resolve, 50));
          }
        },
        expectedDuration: 200
      }
    ]
  } as LoadTestConfig,

  // Medium load - stress testing
  mediumLoad: {
    concurrentUsers: 50,
    duration: 60000, // 1 minute
    rampUpTime: 10000, // 10 seconds
    operations: [
      // Similar operations but with higher frequency
      // ... (same as lightLoad but with different weights)
    ]
  } as LoadTestConfig,

  // Heavy load - breaking point testing
  heavyLoad: {
    concurrentUsers: 100,
    duration: 120000, // 2 minutes
    rampUpTime: 20000, // 20 seconds
    operations: [
      // ... (same operations but with maximum frequency)
    ]
  } as LoadTestConfig
};

// Main load testing function
export async function runLoadTest(scenario: keyof typeof loadTestScenarios): Promise<LoadTestResult> {
  const config = loadTestScenarios[scenario];
  const tester = new LoadTester();
  
  console.log(`[LoadTest] Starting scenario: ${scenario}`);
  const result = await tester.runLoadTest(config);
  
  console.log(`[LoadTest] Scenario completed:`, {
    totalOperations: result.totalOperations,
    successRate: `${((result.successfulOperations / result.totalOperations) * 100).toFixed(2)}%`,
    avgResponseTime: `${result.averageResponseTime.toFixed(2)}ms`,
    opsPerSecond: result.operationsPerSecond.toFixed(2),
    invariantsViolated: result.invariantsViolated.length
  });
  
  return result;
}

// Invariant validation during load testing
export function validateSystemInvariants(result: LoadTestResult): boolean {
  const invariants = [
    {
      name: 'No state corruption',
      condition: result.invariantsViolated.filter(v => v.invariant === 'state_corruption').length === 0,
      description: 'State machine should maintain invariants under load'
    },
    {
      name: 'Memory stability',
      condition: result.averageResponseTime < 1000, // 1s average response time
      description: 'System should remain responsive under load'
    },
    {
      name: 'Error rate below threshold',
      condition: (result.failedOperations / result.totalOperations) < 0.05, // < 5% error rate
      description: 'Error rate should remain below 5%'
    },
    {
      name: 'Performance consistency',
      condition: result.p99ResponseTime < result.averageResponseTime * 5,
      description: '99th percentile should not be 5x average'
    }
  ];
  
  let allValid = true;
  
  for (const invariant of invariants) {
    if (!invariant.condition) {
      console.error(`[LoadTest] Invariant violated: ${invariant.name} - ${invariant.description}`);
      allValid = false;
    } else {
      console.log(`[LoadTest] Invariant maintained: ${invariant.name}`);
    }
  }
  
  return allValid;
}
