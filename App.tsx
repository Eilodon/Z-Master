import * as React from 'react';
import { MainView } from './src/views/MainView';
import { dbService } from './services/db';
import { useZenStore } from './store/zenStore';

export default function App() {
  const { setHistory } = useZenStore();

  React.useEffect(() => {
    // Load initial history
    dbService.getAllEntries().then(entries => {
      setHistory(entries);
    }).catch(e => {
      console.error("DB Load failed", e);
    });
  }, [setHistory]);

  return (
    <MainView />
  );
}
