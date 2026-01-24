import { useState, useRef } from 'react';

// Web Bluetooth Type Extensions
interface BluetoothDevice extends EventTarget {
    id: string;
    name?: string;
    gatt?: BluetoothRemoteGATTServer;
    addEventListener(type: string, listener: EventListener): void;
}

interface BluetoothRemoteGATTServer {
    device: BluetoothDevice;
    connected: boolean;
    connect(): Promise<BluetoothRemoteGATTServer>;
    disconnect(): void;
    getPrimaryService(service: BluetoothServiceUUID): Promise<BluetoothRemoteGATTService>;
}

interface BluetoothRemoteGATTService {
    getCharacteristic(characteristic: BluetoothCharacteristicUUID): Promise<BluetoothRemoteGATTCharacteristic>;
}

interface BluetoothRemoteGATTCharacteristic extends EventTarget {
    value?: DataView;
    startNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
    addEventListener(type: string, listener: EventListener): void;
}

type BluetoothServiceUUID = number | string;
type BluetoothCharacteristicUUID = number | string;

interface NavigatorBluetooth {
    requestDevice(options: RequestDeviceOptions): Promise<BluetoothDevice>;
}

interface RequestDeviceOptions {
    filters?: Array<{ services?: BluetoothServiceUUID[] }>;
    optionalServices?: BluetoothServiceUUID[];
    acceptAllDevices?: boolean;
}

// Extend global Navigator
declare global {
    interface Navigator {
        bluetooth: NavigatorBluetooth;
    }
}

// Future-proof interface for Biometric Data
export interface BiometricData {
    heartRate: number; // bpm
    hrv: number; // ms - Heart Rate Variability (Estimated)
    stressLevel: 'low' | 'moderate' | 'high';
    source: 'simulated' | 'bluetooth';
    deviceName?: string;
}

export function useBiometrics() {
    const [data, setData] = useState<BiometricData | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [device, setDevice] = useState<BluetoothDevice | null>(null);
    const [error, setError] = useState<string | null>(null);

    // RR Interval History for HRV Calculation
    const rrIntervals = useRef<number[]>([]);

    const connect = async () => {
        setError(null);
        try {
            console.log("[Biometrics] Requesting Bluetooth Device...");
            const device = await navigator.bluetooth.requestDevice({
                filters: [{ services: ['heart_rate'] }],
                optionalServices: ['battery_service']
            });

            device.addEventListener('gattserverdisconnected', onDisconnected);
            setDevice(device);

            console.log("[Biometrics] Connecting to GATT Server...");
            const server = await device.gatt?.connect();

            if (!server) throw new Error("GATT Server not found");

            const service = await server.getPrimaryService('heart_rate');
            const characteristic = await service.getCharacteristic('heart_rate_measurement');

            await characteristic.startNotifications();
            characteristic.addEventListener('characteristicvaluechanged', handleHeartRateChanged);

            setIsConnected(true);
            console.log(`[Biometrics] Connected to ${device.name || 'Unknown Device'}`);

        } catch (err: any) {
            console.error("[Biometrics] Connection failed", err);
            setError(err.message || "Connection failed");
            setIsConnected(false);
        }
    };

    const disconnect = () => {
        if (device && device.gatt?.connected) {
            device.gatt.disconnect();
        }
    };

    const onDisconnected = () => {
        console.log('[Biometrics] Device disconnected');
        setIsConnected(false);
        setData(null);
        setDevice(null);
        rrIntervals.current = [];
    };

    /**
     * Parse Heart Rate Measurement Value
     * Flags:
     *   Bit 0: Heart Rate Format (0 = UINT8, 1 = UINT16)
     *   Bit 1: Sensor Contact Status
     *   Bit 2: Energy Expended Status
     *   Bit 3: RR-Interval (0 = Not present, 1 = Present)
     */
    const handleHeartRateChanged = (event: Event) => {
        const value = (event.target as BluetoothRemoteGATTCharacteristic).value;
        if (!value) return;

        const flags = value.getUint8(0);
        const hrFormat = flags & 0x01; // 0 = 8bit, 1 = 16bit
        const rrPresent = (flags & 0x10) >> 4; // Bit 4 is usually RR-Interval, but standard says Bit 4

        let heartRate: number;
        let offset = 1;

        if (hrFormat === 0) {
            heartRate = value.getUint8(offset);
            offset += 1;
        } else {
            heartRate = value.getUint16(offset, true);
            offset += 2;
        }

        // Calculate HRV (RMSSD) if RR intervals are present
        // Note: Standard HR Service puts RR intervals at the end
        // Simplification: We estimate based on available data or simulate if missing

        // --- REAL DATA ---
        let currentHrv = 50; // Default baseline
        // TODO: Strict RR-Interval parsing if supported by device

        // Determine Stress Level based on HR/HRV
        // Higher HR (>90) or Lower HRV (<30) -> High Stress
        let stress: 'low' | 'moderate' | 'high' = 'low';

        if (heartRate > 100) stress = 'high';
        else if (heartRate > 80) stress = 'moderate';
        else stress = 'low';

        setData({
            heartRate,
            hrv: currentHrv, // Placeholder until deep RR parsing
            stressLevel: stress,
            source: 'bluetooth',
            deviceName: device?.name
        });
    };

    return {
        data,
        isConnected,
        connect,
        disconnect,
        error
    };
}
