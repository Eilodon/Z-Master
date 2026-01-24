import { useCallback, useEffect } from 'react';
import { useZenStore } from '../store/zenStore';

export function usePermissions() {
    const { micStatus, setMicStatus } = useZenStore();

    useEffect(() => {
        // Check initial permission state
        if (typeof navigator !== 'undefined' && navigator.permissions && navigator.permissions.query) {
            navigator.permissions.query({ name: 'microphone' as any })
                .then((result) => {
                    if (result.state === 'granted') {
                        setMicStatus('granted');
                    } else if (result.state === 'denied') {
                        setMicStatus('denied');
                    }

                    // Listen for changes
                    result.onchange = () => {
                        if (result.state === 'granted') setMicStatus('granted');
                        else if (result.state === 'denied') setMicStatus('denied');
                        else setMicStatus('idle');
                    };
                })
                .catch(() => {
                    // Ignore errors in environments that don't support query
                });
        }
    }, [setMicStatus]);

    const requestInitialPermissions = useCallback(async () => {
        if (micStatus === 'granted') return;

        setMicStatus('prompting');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            // Stop tracks immediately as we just needed the permission grant
            stream.getTracks().forEach(track => track.stop());
            setMicStatus('granted');
        } catch (error) {
            console.error('Permission denied:', error);
            setMicStatus('denied');
        }
    }, [micStatus, setMicStatus]);

    return { requestInitialPermissions, micStatus };
}
