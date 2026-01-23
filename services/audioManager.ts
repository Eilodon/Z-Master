
// --- AUDIO WORKLET FOR VAD ---
// This code runs in the AudioWorkletGlobalScope

// --- ENHANCED AUDIO WORKLET ---
// Includes error handling, overflow protection, and adaptive buffering

export const AUDIO_WORKLET_CODE = `
class ZenAudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bufferSize = 2048;
    this.buffer = new Float32Array(this.bufferSize);
    this.bufferIndex = 0;
    this.overflowCount = 0;
    this.maxOverflow = 10;
    this.lastProcessTime = 0;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const channel0 = input?.[0];

    if (!channel0 || channel0.length === 0) {
      return true;
    }

    // Overflow protection
    const currentTime = currentTime || 0;
    if (currentTime - this.lastProcessTime > 100) {
      this.overflowCount++;
      if (this.overflowCount > this.maxOverflow) {
        this.port.postMessage({ type: 'error', message: 'Audio overflow detected' });
        this.reset();
      }
    }
    this.lastProcessTime = currentTime;

    // Process audio samples
    for (let i = 0; i < channel0.length; i++) {
      this.buffer[this.bufferIndex++] = channel0[i];

      // Buffer full handling
      if (this.bufferIndex >= this.bufferSize) {
        try {
          this.port.postMessage({
            type: 'input_data',
            buffer: this.buffer.slice()
          });
        } catch (error) {
          this.port.postMessage({ type: 'error', message: 'Buffer send failed' });
        }
        
        this.bufferIndex = 0;
        this.overflowCount = 0;
      }
    }

    return true;
  }

  reset() {
    this.bufferIndex = 0;
    this.overflowCount = 0;
    this.buffer.fill(0);
  }
}

registerProcessor('zen-audio-processor', ZenAudioProcessor);
`;

/**
 * Utility to convert Float32 to 16-bit PCM for Gemini
 */
export const floatTo16BitPCM = (float32Array: Float32Array): ArrayBuffer => {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < float32Array.length; i++) {
    let s = Math.max(-1, Math.min(1, float32Array[i]));
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
  return buffer;
};

export const base64EncodeAudio = (float32Array: Float32Array): string => {
  const pcm = floatTo16BitPCM(float32Array);
  let binary = '';
  const bytes = new Uint8Array(pcm);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};
// --- ROBUST VOICE ACTIVITY DETECTION ---
// Energy-based VAD with adaptive thresholding and noise floor estimation

export class RobustVoiceDetector {
  private sampleRate: number;
  private energyThreshold: number;
  private noiseFloor: number;
  private adaptationRate: number;
  private voiceFrames: number = 0;
  private silenceFrames: number = 0;
  private readonly VOICE_THRESHOLD_FRAMES = 3;
  private readonly SILENCE_THRESHOLD_FRAMES = 10;
  private readonly MIN_ENERGY_THRESHOLD = 0.01;
  private readonly MAX_ENERGY_THRESHOLD = 0.5;

  constructor(sampleRate: number) {
    this.sampleRate = sampleRate;
    this.energyThreshold = 0.05; // Initial threshold
    this.noiseFloor = 0.001;
    this.adaptationRate = 0.1;
  }

  /**
   * Process audio frame and detect voice activity
   * Uses energy-based detection with adaptive threshold
   */
  process(audioData: Float32Array): boolean {
    if (!audioData || audioData.length === 0) return false;

    // Calculate RMS energy
    const energy = this.calculateRMS(audioData);
    
    // Update noise floor estimation (slow adaptation)
    if (energy < this.energyThreshold) {
      this.noiseFloor = this.noiseFloor * 0.99 + energy * 0.01;
    }

    // Adaptive threshold adjustment
    this.adaptThreshold(energy);

    // Voice activity detection with hysteresis
    const isVoiceActive = energy > this.energyThreshold;
    
    if (isVoiceActive) {
      this.voiceFrames++;
      this.silenceFrames = 0;
    } else {
      this.silenceFrames++;
      if (this.silenceFrames > this.SILENCE_THRESHOLD_FRAMES) {
        this.voiceFrames = 0;
      }
    }

    // Require consecutive voice frames to trigger detection
    return this.voiceFrames >= this.VOICE_THRESHOLD_FRAMES;
  }

  private calculateRMS(audioData: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < audioData.length; i++) {
      sum += audioData[i] * audioData[i];
    }
    return Math.sqrt(sum / audioData.length);
  }

  private adaptThreshold(currentEnergy: number): void {
    // Slowly adapt threshold based on recent audio levels
    if (currentEnergy > this.energyThreshold) {
      // Voice detected - slowly increase threshold
      this.energyThreshold += this.adaptationRate * 0.01;
    } else {
      // Silence detected - slowly decrease threshold
      this.energyThreshold -= this.adaptationRate * 0.005;
    }

    // Keep threshold in reasonable bounds
    this.energyThreshold = Math.max(
      this.MIN_ENERGY_THRESHOLD,
      Math.min(this.MAX_ENERGY_THRESHOLD, this.energyThreshold)
    );

    // Ensure threshold is above noise floor
    this.energyThreshold = Math.max(this.energyThreshold, this.noiseFloor * 3);
  }

  /**
   * Reset detector state
   */
  reset(): void {
    this.voiceFrames = 0;
    this.silenceFrames = 0;
    this.energyThreshold = 0.05;
    this.noiseFloor = 0.001;
  }

  /**
   * Get current threshold for debugging
   */
  getThreshold(): number {
    return this.energyThreshold;
  }

  /**
   * Get noise floor estimation
   */
  getNoiseFloor(): number {
    return this.noiseFloor;
  }
}
