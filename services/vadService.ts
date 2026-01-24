
import { MicVAD, utils } from "@ricky0123/vad-web";

export type VadStatus = 'loading' | 'ready' | 'listening' | 'processing' | 'error';

interface VadConfig {
    onSpeechStart: () => void;
    onSpeechEnd: (audio: Float32Array) => void;
    onVADMisfire?: () => void;
}

export class VadService {
    private static vad: MicVAD | null = null;
    private static stream: MediaStream | null = null;
    private static status: VadStatus = 'loading';

    static async start(config: VadConfig): Promise<void> {
        try {
            this.status = 'loading';

            // 1. Get User Media with specific constraints (Voice optimized)
            this.stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    channelCount: 1,
                    echoCancellation: true,
                    autoGainControl: true,
                    noiseSuppression: true // Browser generic noise suppression
                }
            });

            // 2. Initialize VAD with the stream
            this.vad = await MicVAD.new({
                stream: this.stream,
                positiveSpeechThreshold: 0.8,
                negativeSpeechThreshold: 0.45,
                minSpeechFrames: 4, // Reduce latency
                preSpeechPadFrames: 5,
                onSpeechStart: () => {
                    console.log("[VAD] Speech Detected");
                    config.onSpeechStart();
                },
                onSpeechEnd: (audio) => {
                    console.log("[VAD] Speech Ended. Length:", audio.length);
                    config.onSpeechEnd(audio);
                },
                onVADMisfire: () => {
                    console.log("[VAD] Misfire");
                    if (config.onVADMisfire) config.onVADMisfire();
                }
            });

            // 3. Start Listening
            this.vad.start();
            this.status = 'listening';

        } catch (e) {
            console.error("[VAD] Failed to start:", e);
            this.status = 'error';
            throw e; // Propagate to UI
        }
    }

    static stop() {
        if (this.vad) {
            this.vad.pause();
            this.vad = null; // Destroy instance
        }

        // Stop tracks
        if (this.stream) {
            this.stream.getTracks().forEach(t => t.stop());
            this.stream = null;
        }

        this.status = 'ready';
    }

    static isListening(): boolean {
        return this.status === 'listening';
    }
}
