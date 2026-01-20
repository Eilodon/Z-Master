import { useState, useEffect } from 'react';

// Future-proof interface for Biometric Data
export interface BiometricData {
    heartRate: number; // bpm
    hrv: number; // ms - Heart Rate Variability (Stress indicator)
    stressLevel: 'low' | 'moderate' | 'high';
    source: 'simulated' | 'watch' | 'ring';
}

export function useBiometrics() {
    const [data, setData] = useState<BiometricData | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    // MOCK: Simulate connection to a health device
    const connect = () => {
        console.log("[Biometrics] Scanning for devices...");
        setTimeout(() => {
            setIsConnected(true);
            console.log("[Biometrics] Connected to 'ZenRing'");
        }, 1500);
    };

    const disconnect = () => {
        setIsConnected(false);
        setData(null);
    };

    // MOCK: Generate data loop
    useEffect(() => {
        if (!isConnected) return;

        const interval = setInterval(() => {
            // Simulate HRV fluctuating between 20 (stressed) and 80 (calm)
            const mockHrv = 20 + Math.random() * 60;
            const mockHr = 60 + Math.random() * 20;

            setData({
                heartRate: Math.round(mockHr),
                hrv: Math.round(mockHrv),
                stressLevel: mockHrv < 30 ? 'high' : mockHrv < 50 ? 'moderate' : 'low',
                source: 'simulated'
            });
        }, 3000);

        return () => clearInterval(interval);
    }, [isConnected]);

    return {
        data,
        isConnected,
        connect,
        disconnect
    };
}
