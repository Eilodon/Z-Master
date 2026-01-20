import { useRef, useEffect, useState } from 'react';
import { sessionManager } from '../src/core/connection/SessionManager';

interface UseZenSessionProps {
  onEmergencyDetected: () => void;
  onError: (msg: string, type: 'error' | 'warn' | 'info') => void;
}

export function useZenSession({
  onEmergencyDetected,
  onError
}: UseZenSessionProps) {
  // We can expose the analyser for the OrbViz if needed
  // Since sessionManager is a singleton, we can just access it.
  // But React might need to know when it changes?
  // OrbViz uses a ref to analyser usually.

  // For now, let's keep the API compatible.

  const connect = () => sessionManager.connect();
  const disconnect = () => sessionManager.disconnect();
  const sendText = (text: string) => sessionManager.sendText(text);

  // Analyser is tricky because it's set asynchronously.
  // We can poll or use a subscription if we add it to SessionManager.
  // For this refactor, let's expose a getter that the Viz component checks.

  const analyserRef = useRef<AnalyserNode | null>(null);

  // Sync analyserRef with sessionManager
  // This is a bit hacky but keeps the hook API.
  // A better way is for OrbViz to ask SessionManager directly.
  useEffect(() => {
    const interval = setInterval(() => {
      analyserRef.current = sessionManager.getAnalyser();
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return {
    connect,
    disconnect,
    sendText,
    analyserRef
  };
}
