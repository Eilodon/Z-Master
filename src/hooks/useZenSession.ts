import { useRef, useCallback } from 'react';
import { sessionManager } from '../core/connection/SessionManager';
import { ZenResponse } from '../../types';

interface UseZenSessionProps {
    onEmergencyDetected?: () => void;
    onError?: (message: string, kind: 'error' | 'warn' | 'info' | 'success') => void;
}

export function useZenSession({ onEmergencyDetected, onError }: UseZenSessionProps = {}) {
    const analyserRef = useRef<AnalyserNode | null>(null);

    const connect = useCallback(async () => {
        try {
            await sessionManager.connect();
            analyserRef.current = sessionManager.getAnalyser();
        } catch (error: any) {
            console.error('Session connection error:', error);
            onError?.(error.message || 'Connection failed', 'error');
        }
    }, [onError]);

    const disconnect = useCallback(() => {
        try {
            sessionManager.disconnect();
            analyserRef.current = null;
        } catch (error: any) {
            console.error('Session disconnect error:', error);
        }
    }, []);

    const sendText = useCallback(async (text: string): Promise<ZenResponse | null> => {
        try {
            const response = await sessionManager.sendText(text);
            return response;
        } catch (error: any) {
            console.error('Session sendText error:', error);
            onError?.(error.message || 'Failed to send message', 'error');
            return null;
        }
    }, [onError]);

    return {
        connect,
        disconnect,
        sendText,
        analyserRef
    };
}
