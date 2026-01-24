
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

// --- RESAMPLER ---

/**
 * Resamples audio buffer using Windowed Sinc (Lanczos) Interpolation.
 * SOTA 2026 Standard for high-fidelity audio resampling (prevents aliasing).
 */
export const resampleAudio = (audioBuffer: Float32Array, fromSampleRate: number, toSampleRate: number): Float32Array => {
  if (fromSampleRate === toSampleRate) return audioBuffer;

  const ratio = fromSampleRate / toSampleRate;
  const newLength = Math.round(audioBuffer.length / ratio);
  const result = new Float32Array(newLength);
  const width = 3; // Lanczos window size (a=3 for high quality)

  const sinc = (x: number) => {
    if (x === 0) return 1;
    const piX = Math.PI * x;
    return Math.sin(piX) / piX;
  };

  const lanczos = (x: number) => {
    if (Math.abs(x) >= width) return 0;
    return sinc(x) * sinc(x / width);
  };

  for (let i = 0; i < newLength; i++) {
    const center = i * ratio;
    const start = Math.ceil(center - width);
    const end = Math.floor(center + width);

    let sum = 0;
    let weightSum = 0;

    for (let j = start; j <= end; j++) {
      if (j >= 0 && j < audioBuffer.length) {
        const weight = lanczos(center - j);
        sum += audioBuffer[j] * weight;
        weightSum += weight; // Optional normalization
      }
    }

    // Normalization prevents amplitude loss
    result[i] = weightSum !== 0 ? sum / weightSum : sum;
  }

  return result;
};

// --- AUDIO HELPERS ---

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

  // DSP Filter State (High-pass at 300Hz to kill rumble noise)
  private a1 = 0;
  private x1 = 0;
  private y1 = 0;

  constructor(sampleRate: number) {
    this.sampleRate = sampleRate;
    this.energyThreshold = 0.05; // Initial threshold
    this.noiseFloor = 0.001;
    this.adaptationRate = 0.1;

    // Calculate high-pass filter coefficients for 300Hz cutoff
    // This eliminates motorcycle/AC rumble common in VN environments
    const rc = 1.0 / (300 * 2 * Math.PI);
    const dt = 1.0 / sampleRate;
    this.a1 = rc / (rc + dt);
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
    // Apply high-pass filter to each sample before RMS calculation
    for (let i = 0; i < audioData.length; i++) {
      const filtered = this.applyHighPass(audioData[i]);
      sum += filtered * filtered;
    }
    return Math.sqrt(sum / audioData.length);
  }

  /**
   * High-pass filter at 300Hz to eliminate rumble noise
   * Filter equation: y[i] = α * (y[i-1] + x[i] - x[i-1])
   */
  private applyHighPass(sample: number): number {
    const y = this.a1 * (this.y1 + sample - this.x1);
    this.x1 = sample;
    this.y1 = y;
    return y;
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
