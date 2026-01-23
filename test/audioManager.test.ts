import { describe, it, expect } from 'vitest';
import { floatTo16BitPCM, base64EncodeAudio, AUDIO_WORKLET_CODE, RobustVoiceDetector } from '../services/audioManager';

describe('Audio Manager', () => {
    it('defines AUDIO_WORKLET_CODE', () => {
        expect(typeof AUDIO_WORKLET_CODE).toBe('string');
        expect(AUDIO_WORKLET_CODE.length).toBeGreaterThan(0);
        expect(AUDIO_WORKLET_CODE).toContain('class VadAudioWorklet');
    });

    it('converts float32 to 16bit PCM', () => {
        const floatData = new Float32Array([0, 0.5, -0.5, 1, -1]);
        const pcm = floatTo16BitPCM(floatData);
        expect(pcm.byteLength).toBe(10); // 5 samples * 2 bytes
        const view = new Int16Array(pcm);
        expect(view[0]).toBe(0);
        expect(view[1]).toBe(Math.floor(0.5 * 0x7FFF));
        expect(view[2]).toBe(Math.ceil(-0.5 * 0x8000)); // or floor depending on implementation
        expect(view[3]).toBe(0x7FFF);
        expect(view[4]).toBe(-0x8000);
    });

    it('encodes to base64', () => {
        const floatData = new Float32Array([0, 0]);
        const b64 = base64EncodeAudio(floatData);
        // 0x0000 0x0000 -> 4 bytes of 0 -> AAAAAA==
        expect(b64).toBe('AAAAAA==');
    });

    it('stubs RobustVoiceDetector', () => {
        const detector = new RobustVoiceDetector(16000);
        expect(detector.process(new Float32Array(10))).toBe(false);
    });
});
