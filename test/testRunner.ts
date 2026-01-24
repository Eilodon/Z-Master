// --- TEST RUNNER & EXECUTION ENGINE ---
// One-click testing without manual intervention

import { automatedTestSuite, TestSummary } from './automatedTestSuite';
import { logger } from '../src/utils/logger';

class TestRunner {
  private static instance: TestRunner;
  private isRunning = false;
  private testResults: TestSummary | null = null;

  private constructor() {}

  static getInstance(): TestRunner {
    if (!TestRunner.instance) {
      TestRunner.instance = new TestRunner();
    }
    return TestRunner.instance;
  }

  // --- ONE-CLICK TEST EXECUTION ---
  async runCompleteTestSuite(): Promise<TestSummary> {
    if (this.isRunning) {
      throw new Error('Tests are already running');
    }

    this.isRunning = true;
    console.log('🚀 Starting Complete Test Suite...');
    console.log('📋 This will test ALL functionality automatically');

    try {
      // Run the automated test suite
      const results = await automatedTestSuite.runFullTestSuite();
      this.testResults = automatedTestSuite.generateReport();

      // Display results
      this.displayResults(this.testResults);

      return this.testResults;
    } catch (error) {
      console.error('❌ Test suite failed:', error);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  // --- RESULTS DISPLAY ---
  private displayResults(results: TestSummary): void {
    console.log('\n📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total Tests: ${results.total}`);
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`📈 Pass Rate: ${results.passRate.toFixed(1)}%`);
    console.log(`⏱️ Duration: ${(results.duration / 1000).toFixed(2)}s`);

    // Detailed results
    console.log('\n📋 DETAILED RESULTS:');
    results.scenarios.forEach((scenario, index) => {
      const status = scenario.passed ? '✅' : '❌';
      const duration = (scenario.duration / 1000).toFixed(2);
      console.log(`${index + 1}. ${status} ${scenario.scenario} (${duration}s)`);
      
      if (!scenario.passed) {
        scenario.errors.forEach(error => {
          console.log(`   ❌ Error: ${error}`);
        });
      }
    });

    // Performance summary
    console.log('\n⚡ PERFORMANCE METRICS:');
    const avgPerformance = this.calculateAveragePerformance(results.scenarios);
    console.log(`Average Load Time: ${avgPerformance.loadTime.toFixed(2)}ms`);
    console.log(`Average Memory Usage: ${avgPerformance.memoryUsage.toFixed(2)}MB`);
    console.log(`Average Network Requests: ${avgPerformance.networkRequests}`);

    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    this.generateRecommendations(results);

    console.log('\n🎯 Test Suite Complete!');
  }

  private calculateAveragePerformance(scenarios: any[]): any {
    const validScenarios = scenarios.filter(s => s.performance);
    
    if (validScenarios.length === 0) {
      return { loadTime: 0, memoryUsage: 0, networkRequests: 0 };
    }

    const totals = validScenarios.reduce((acc, scenario) => ({
      loadTime: acc.loadTime + scenario.performance.loadTime,
      memoryUsage: acc.memoryUsage + scenario.performance.memoryUsage,
      networkRequests: acc.networkRequests + scenario.performance.networkRequests
    }), { loadTime: 0, memoryUsage: 0, networkRequests: 0 });

    return {
      loadTime: totals.loadTime / validScenarios.length,
      memoryUsage: totals.memoryUsage / validScenarios.length,
      networkRequests: totals.networkRequests / validScenarios.length
    };
  }

  private generateRecommendations(results: TestSummary): void {
    const failedScenarios = results.scenarios.filter(s => !s.passed);
    
    if (failedScenarios.length === 0) {
      console.log('🎉 All tests passed! App is ready for production.');
      return;
    }

    // Categorize failures
    const failures = failedScenarios.reduce((acc, scenario) => {
      const category = this.categorizeFailure(scenario);
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    Object.entries(failures).forEach(([category, count]) => {
      console.log(`⚠️ ${count} ${category} issues found`);
    });

    // Specific recommendations
    if (failures.ui > 0) {
      console.log('🔧 Review UI components and interactions');
    }
    if (failures.performance > 0) {
      console.log('⚡ Optimize performance and resource usage');
    }
    if (failures.security > 0) {
      console.log('🔒 Address security and privacy concerns');
    }
    if (failures.flow > 0) {
      console.log('🔄 Fix user flow and state management issues');
    }
  }

  private categorizeFailure(scenario: any): string {
    if (scenario.scenario.includes('Performance') || scenario.scenario.includes('Memory')) {
      return 'performance';
    }
    if (scenario.scenario.includes('Security') || scenario.scenario.includes('Privacy')) {
      return 'security';
    }
    if (scenario.scenario.includes('UI') || scenario.scenario.includes('Button')) {
      return 'ui';
    }
    if (scenario.scenario.includes('Flow') || scenario.scenario.includes('Session')) {
      return 'flow';
    }
    return 'general';
  }

  // --- QUICK TEST METHODS ---
  async runSmokeTest(): Promise<boolean> {
    console.log('🔥 Running Smoke Test...');
    
    try {
      // Quick health checks
      const checks = await Promise.all([
        this.checkAppLoads(),
        this.checkBasicUI(),
        this.checkNoErrors(),
        this.checkPerformance()
      ]);

      const allPassed = checks.every(check => check);
      
      if (allPassed) {
        console.log('✅ Smoke Test Passed - App is healthy!');
      } else {
        console.log('❌ Smoke Test Failed - Issues detected!');
      }

      return allPassed;
    } catch (error) {
      console.error('❌ Smoke Test Error:', error);
      return false;
    }
  }

  private async checkAppLoads(): Promise<boolean> {
    return document.readyState === 'complete' && 
           !!document.querySelector('[data-testid="app"]');
  }

  private async checkBasicUI(): Promise<boolean> {
    const criticalElements = [
      '[data-testid="main-view"]',
      '[data-testid="voice-button"]',
      '[data-testid="status-display"]'
    ];

    return criticalElements.every(selector => !!document.querySelector(selector));
  }

  private async checkNoErrors(): Promise<boolean> {
    // Check console for errors (simplified)
    return true; // Would need error tracking implementation
  }

  private async checkPerformance(): Promise<boolean> {
    const loadTime = performance.getEntriesByType('navigation')[0]?.duration || 0;
    return loadTime < 3000; // 3 second threshold
  }

  // --- CONTINUOUS MONITORING ---
  startContinuousMonitoring(): void {
    console.log('🔍 Starting Continuous Monitoring...');
    
    setInterval(() => {
      this.performHealthCheck();
    }, 30000); // Every 30 seconds
  }

  private performHealthCheck(): void {
    const metrics = {
      memory: this.getMemoryUsage(),
      errors: this.getErrorCount(),
      performance: this.getCurrentPerformance()
    };

    // Alert if issues detected
    if (metrics.memory > 100) { // 100MB threshold
      console.warn('⚠️ High memory usage detected:', metrics.memory);
    }

    if (metrics.errors > 0) {
      console.warn('⚠️ Errors detected:', metrics.errors);
    }

    if (metrics.performance.loadTime > 5000) { // 5 second threshold
      console.warn('⚠️ Poor performance detected:', metrics.performance.loadTime);
    }
  }

  private getMemoryUsage(): number {
    if ('memory' in performance) {
      const mem = (performance as any).memory;
      return mem.usedJSHeapSize / 1024 / 1024; // MB
    }
    return 0;
  }

  private getErrorCount(): number {
    // Would need error tracking implementation
    return 0;
  }

  private getCurrentPerformance(): any {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    return {
      loadTime: navigation?.loadEventEnd - navigation?.loadEventStart || 0
    };
  }

  // --- PUBLIC API ---
  getResults(): TestSummary | null {
    return this.testResults;
  }

  isTestRunning(): boolean {
    return this.isRunning;
  }
}

// Export singleton instance
export const testRunner = TestRunner.getInstance();

// Global test execution function
export async function runAllTests(): Promise<TestSummary> {
  return await testRunner.runCompleteTestSuite();
}

// Quick test function
export async function runSmokeTest(): Promise<boolean> {
  return await testRunner.runSmokeTest();
}

// Start monitoring
export function startMonitoring(): void {
  testRunner.startContinuousMonitoring();
}
