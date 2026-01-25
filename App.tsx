import * as React from 'react';
import { MainView } from './src/views/MainView';
import { dbService } from './services/db';
import { useZenStore } from './store/zenStore';
import { ExtremeErrorBoundary } from './components/ExtremeErrorBoundary';
import { CryptoErrorBoundary } from './components/CryptoErrorBoundary';
import { TestDashboard } from './test/TestDashboard';

export default function App() {
  const setHistory = useZenStore(state => state.setHistory);

  React.useEffect(() => {
    // Load initial history with error handling
    const loadHistory = async () => {
      try {
        const entries = await dbService.getAllEntries();
        setHistory(entries);
      } catch (error) {
        console.error('Failed to load history:', error);
      }
    };

    loadHistory();
  }, [setHistory]);

  return (
    <ExtremeErrorBoundary name="App-Level" severity="critical">
      <CryptoErrorBoundary>
        <MainView />
        <TestDashboard />
      </CryptoErrorBoundary>
    </ExtremeErrorBoundary>
  );
}
