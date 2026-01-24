// Audio Processor Worker
// Offloads heavy audio decoding and resampling from the Main Thread (UI)

import { resampleAudio, floatTo16BitPCM } from "../../services/audioManager";

// Define the worker's input/output types
type WorkerMessage =
    | { type: 'PROCESS_AUDIO', payload: { base64: string, sampleRate: number } }
    | { type: 'RESET' };

type WorkerResponse =
    | { type: 'AUDIO_CHUNK', buffer: Float32Array }
    | { type: 'ERROR', message: string };

self.onmessage = (event: MessageEvent<WorkerMessage>) => {
    const { type } = event.data;

    if (type === 'PROCESS_AUDIO') {
        try {
            const { base64, sampleRate } = (event.data as any).payload;
            const float32 = decodeBase64ToFloat32(base64);

            // Resample if needed (usually Gemini sends 24k)
            // But if we want to play at system rate (e.g. 48k or 44.1k), we might resample here.
            // However, Web Audio API handles resampling automatically if we feed it a buffer.
            // BUT the audit said "Resampling (Lanczos) is heavy". 
            // If we are strictly just decoding, it's fast. 
            // If we are resampling for VAD or Analysis, we do it here.
            // For now, let's just decode and maybe resample to a standard 24k if needed.
            // Actually, ZenLiveSession decodes and then schedules.

            // OPTIMIZATION: We just decode here to keep main thread free.
            // TypeScript fix for Worker vs Window postMessage
            (self as unknown as Worker).postMessage({ type: 'AUDIO_CHUNK', buffer: float32 }, [float32.buffer]);

        } catch (e: any) {
            (self as unknown as Worker).postMessage({ type: 'ERROR', message: e.message });
        }
    }
};

// --- HELPER FUNCTIONS (Moved from ZenLiveSession) ---

function decodeBase64ToFloat32(base64: string): Float32Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
    const int16 = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) {
        // Little endian 16-bit PCM to float
        float32[i] = int16[i] / 32768.0;
    }
    return float32;
}
