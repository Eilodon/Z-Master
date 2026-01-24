import * as React from 'react';
import { MainView } from './src/views/MainView';
import { dbService } from './services/db';
import { useZenStore } from './store/zenStore';
import { CryptoErrorBoundary } from './components/CryptoErrorBoundary';

export default function App() {
  const { setHistory } = useZenStore();

  React.useEffect(() => {
    // Load initial history with error handling
    const loadHistory = async () => {
      try {
        const entries = await dbService.getAllEntries();
        setHistory(entries);
      } catch (error) {
        console.error("DB Load failed - this is normal if vault is locked:", error);
        // Don't throw error - it's normal when vault is locked
      }
    };

    loadHistory();
  }, [setHistory]);

  return (
    <CryptoErrorBoundary>
      <MainView />
    </CryptoErrorBoundary>
  );
}
