// --- ONE-CLICK TEST EXECUTION ---
// Add this to your main App.tsx or create a test component

import React, { useEffect, useState } from 'react';
import { runAllTests, runSmokeTest, startMonitoring } from './testRunner';
import './TestDashboard.css';

export function TestDashboard() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const handleRunAllTests = async () => {
    setIsRunning(true);
    addLog('🚀 Starting complete test suite...');
    
    try {
      const testResults = await runAllTests();
      setResults(testResults);
      addLog(`✅ Tests complete: ${testResults.passed}/${testResults.total} passed`);
    } catch (error) {
      addLog(`❌ Test suite failed: ${error}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleSmokeTest = async () => {
    addLog('🔥 Running smoke test...');
    
    try {
      const passed = await runSmokeTest();
      addLog(passed ? '✅ Smoke test passed' : '❌ Smoke test failed');
    } catch (error) {
      addLog(`❌ Smoke test error: ${error}`);
    }
  };

  const handleStartMonitoring = () => {
    startMonitoring();
    addLog('🔍 Continuous monitoring started');
  };

  useEffect(() => {
    // Auto-start monitoring
    handleStartMonitoring();
  }, []);

  const getResultClass = () => {
    if (!results) return '';
    if (results.passRate === 100) return 'success';
    if (results.passRate >= 80) return 'warning';
    return 'error';
  };

  const getResultIcon = () => {
    if (!results) return '';
    if (results.passRate === 100) return '🎉';
    if (results.passRate >= 80) return '⚠️';
    return '❌';
  };

  return (
    <div className="test-dashboard">
      <h3>Automated Testing Dashboard</h3>
      
      <div className="test-controls">
        <button 
          onClick={handleRunAllTests}
          disabled={isRunning}
          className={`test-button ${isRunning ? 'loading' : ''}`}
        >
          {isRunning ? '⏳ Running...' : '🚀 Run All Tests'}
        </button>
        
        <button 
          onClick={handleSmokeTest}
          className="test-button smoke-test"
        >
          🔥 Smoke Test
        </button>
      </div>

      {results && (
        <div className={`test-results ${getResultClass()}`}>
          <h4>{getResultIcon()} Last Test Results</h4>
          <div>
            <span>Total:</span>
            <span className="font-mono font-bold">{results.total}</span>
          </div>
          <div>
            <span>✅ Passed:</span>
            <span className="font-mono font-bold text-green-400">{results.passed}</span>
          </div>
          <div>
            <span>❌ Failed:</span>
            <span className="font-mono font-bold text-red-400">{results.failed}</span>
          </div>
          <div>
            <span>📈 Pass Rate:</span>
            <span className="font-mono font-bold">{results.passRate.toFixed(1)}%</span>
          </div>
          <div>
            <span>⏱️ Duration:</span>
            <span className="font-mono">{(results.duration / 1000).toFixed(2)}s</span>
          </div>
        </div>
      )}

      <div className="test-logs">
        <h4>📋 Test Logs</h4>
        <div className="log-container">
          {logs.slice(-10).map((log, index) => (
            <div key={index} className="log-entry">
              {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Add this to your main App component:
export function withTesting(App: React.ComponentType) {
  return function AppWithTesting() {
    return (
      <>
        <App />
        <TestDashboard />
      </>
    );
  };
}
