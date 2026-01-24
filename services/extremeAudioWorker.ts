// --- EXTREME WEB WORKER AUDIO PROCESSING ---
// Implements Chrome Web Audio API + Web Workers for background processing
// Offloads intensive audio operations from main thread for better performance

import * as React from 'react';

// Worker code as a string
const AUDIO_WORKER_CODE = `
// --- AUDIO PROCESSING WORKER ---
// High-performance audio analysis in background thread

let audioContext = null;
let analyser = null;
let processingBuffer = null;
let isProcessing = false;

// FFT implementation for frequency analysis
class FFTProcessor {
  constructor(size) {
    this.size = size;
    this.cosTable = new Float32Array(size);
    this.sinTable = new Float32Array(size);
    
    // Precompute trigonometric tables
    for (let i = 0; i < size; i++) {
      const angle = (2 * Math.PI * i) / size;
      this.cosTable[i] = Math.cos(angle);
      this.sinTable[i] = Math.sin(angle);
    }
  }
  
  forward(real, imag) {
    const n = this.size;
    const cos = this.cosTable;
    const sin = this.sinTable;
    
    // Bit-reversal permutation
    let j = 0;
    for (let i = 0; i < n; i++) {
      if (j > i) {
        const tempReal = real[i];
        const tempImag = imag[i];
        real[i] = real[j];
        imag[i] = tempImag;
        real[j] = tempReal;
        imag[j] = tempImag;
      }
      
      let m = n >> 1;
      while (m >= 2 && j >= m) {
        j -= m;
        m >>= 1;
      }
      if (m < j) j += m;
    }
    
    // Cooley-Tukey FFT
    let mmax = 2;
    while (mmax < n) {
      const istep = mmax << 1;
      const theta = Math.PI / mmax;
      
      for (let m = 0; m < mmax; m++) {
        const wtemp = Math.sin(m * theta);
        const wpr = -2.0 * wtemp * wtemp;
        const wpi = Math.sin(2 * m * theta);
        let wr = 1.0;
        let wi = 0.0;
        
        for (let i = m; i < n; i += istep) {
          const j = i + mmax;
          const tempr = wr * real[j] - wi * imag[j];
          const tempi = wr * imag[j] + wi * real[j];
          
          real[j] = real[i] - tempr;
          imag[j] = imag[i] - tempi;
          real[i] += tempr;
          imag[i] += tempi;
          
          const wtemp = wr;
          wr += wtemp * wpr - wi * wpi;
          wi += wi * wpr + wtemp * wpi;
        }
      }
      
      mmax = istep;
    }
  }
}

// Voice Activity Detection (VAD)
class VADProcessor {
  constructor(sampleRate = 44100) {
    this.sampleRate = sampleRate;
    this.frameSize = Math.floor(0.02 * sampleRate); // 20ms frames
    this.energyThreshold = 0.01;
    this.zeroCrossingThreshold = 0.1;
    this.spectralCentroidThreshold = 1000;
  }
  
  processFrame(audioData) {
    const energy = this.calculateEnergy(audioData);
    const zeroCrossings = this.calculateZeroCrossings(audioData);
    const spectralCentroid = this.calculateSpectralCentroid(audioData);
    
    // VAD decision logic
    const voiceActivity = 
      energy > this.energyThreshold &&
      zeroCrossings > this.zeroCrossingThreshold &&
      spectralCentroid > this.spectralCentroidThreshold;
    
    return {
      voiceActivity,
      energy,
      zeroCrossings,
      spectralCentroid
    };
  }
  
  calculateEnergy(audioData) {
    let sum = 0;
    for (let i = 0; i < audioData.length; i++) {
      sum += audioData[i] * audioData[i];
    }
    return sum / audioData.length;
  }
  
  calculateZeroCrossings(audioData) {
    let crossings = 0;
    for (let i = 1; i < audioData.length; i++) {
      if ((audioData[i] >= 0 && audioData[i-1] < 0) || 
          (audioData[i] < 0 && audioData[i-1] >= 0)) {
        crossings++;
      }
    }
    return crossings / audioData.length;
  }
  
  calculateSpectralCentroid(audioData) {
    const fftSize = Math.pow(2, Math.ceil(Math.log2(audioData.length)));
    const real = new Float32Array(fftSize);
    const imag = new Float32Array(fftSize);
    
    // Pad with zeros
    for (let i = 0; i < audioData.length; i++) {
      real[i] = audioData[i];
    }
    
    const fft = new FFTProcessor(fftSize);
    fft.forward(real, imag);
    
    // Calculate spectral centroid
    let weightedSum = 0;
    let magnitudeSum = 0;
    const binResolution = this.sampleRate / fftSize;
    
    for (let i = 0; i < fftSize / 2; i++) {
      const magnitude = Math.sqrt(real[i] * real[i] + imag[i] * imag[i]);
      const frequency = i * binResolution;
      
      weightedSum += frequency * magnitude;
      magnitudeSum += magnitude;
    }
    
    return magnitudeSum > 0 ? weightedSum / magnitudeSum : 0;
  }
}

// Audio processor instance
let vadProcessor = null;
let fftProcessor = null;

// Initialize audio processing
function initialize(config) {
  const { sampleRate = 44100, fftSize = 2048 } = config;
  
  vadProcessor = new VADProcessor(sampleRate);
  fftProcessor = new FFTProcessor(fftSize);
  processingBuffer = new Float32Array(fftSize);
  
  self.postMessage({
    type: 'initialized',
    sampleRate,
    fftSize
  });
}

// Process audio data
function processAudio(audioData) {
  if (!vadProcessor || !fftProcessor || isProcessing) return;
  
  isProcessing = true;
  
  try {
    // Convert to Float32Array if needed
    let floatData;
    if (audioData instanceof Float32Array) {
      floatData = audioData;
    } else if (audioData instanceof Uint8Array) {
      floatData = new Float32Array(audioData.length);
      for (let i = 0; i < audioData.length; i++) {
        floatData[i] = (audioData[i] - 128) / 128.0;
      }
    } else {
      throw new Error('Unsupported audio data format');
    }
    
    // VAD processing
    const vadResult = vadProcessor.processFrame(floatData);
    
    // FFT processing
    const fftReal = new Float32Array(fftProcessor.size);
    const fftImag = new Float32Array(fftProcessor.size);
    
    // Copy and pad data
    const copyLength = Math.min(floatData.length, fftProcessor.size);
    for (let i = 0; i < copyLength; i++) {
      fftReal[i] = floatData[i];
    }
    
    fftProcessor.forward(fftReal, fftImag);
    
    // Calculate frequency bins
    const frequencyBins = new Uint8Array(fftProcessor.size / 2);
    for (let i = 0; i < fftProcessor.size / 2; i++) {
      const magnitude = Math.sqrt(fftReal[i] * fftReal[i] + fftImag[i] * fftImag[i]);
      frequencyBins[i] = Math.min(255, magnitude * 255);
    }
    
    // Calculate audio intensity
    let intensity = 0;
    for (let i = 0; i < frequencyBins.length; i++) {
      intensity += frequencyBins[i];
    }
    intensity = intensity / frequencyBins.length / 255;
    
    self.postMessage({
      type: 'audioProcessed',
      vadResult,
      frequencyBins,
      intensity,
      timestamp: performance.now()
    });
    
  } catch (error) {
    self.postMessage({
      type: 'error',
      error: error.message
    });
  } finally {
    isProcessing = false;
  }
}

// Handle messages from main thread
self.onmessage = function(e) {
  const { type, data } = e.data;
  
  switch (type) {
    case 'initialize':
      initialize(data);
      break;
      
    case 'processAudio':
      processAudio(data);
      break;
      
    case 'getStats':
      self.postMessage({
        type: 'stats',
        isProcessing,
        hasVADProcessor: !!vadProcessor,
        hasFFTProcessor: !!fftProcessor
      });
      break;
      
    default:
      console.warn('Unknown message type:', type);
  }
};
`;

// Main thread worker manager
class ExtremeAudioWorker {
  private worker: Worker | null = null;
  private isInitialized = false;
  private processingQueue: Float32Array[] = [];
  private isProcessing = false;
  private callbacks = new Map<string, (data: any) => void>();
  private messageId = 0;

  constructor() {
    this.initializeWorker();
  }

  private initializeWorker(): void {
    try {
      // Create worker from code string
      const blob = new Blob([AUDIO_WORKER_CODE], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(blob);
      
      this.worker = new Worker(workerUrl);
      this.setupWorkerHandlers();
      
      // Clean up blob URL
      URL.revokeObjectURL(workerUrl);
      
      console.log('[AudioWorker] Worker initialized successfully');
    } catch (error) {
      console.error('[AudioWorker] Failed to initialize worker:', error);
    }
  }

  private setupWorkerHandlers(): void {
    if (!this.worker) return;

    this.worker.onmessage = (e) => {
      const { type, data, messageId } = e.data;
      
      switch (type) {
        case 'initialized':
          this.isInitialized = true;
          console.log('[AudioWorker] Audio processing initialized');
          break;
          
        case 'audioProcessed':
          this.handleAudioProcessed(data);
          break;
          
        case 'error':
          console.error('[AudioWorker] Processing error:', data);
          break;
          
        case 'stats':
          if (this.callbacks.has(messageId)) {
            this.callbacks.get(messageId)?.(data);
            this.callbacks.delete(messageId);
          }
          break;
      }
    };

    this.worker.onerror = (error) => {
      console.error('[AudioWorker] Worker error:', error);
    };

    this.worker.onmessageerror = (error) => {
      console.error('[AudioWorker] Message error:', error);
    };
  }

  private handleAudioProcessed(data: any): void {
    // Notify all registered callbacks
    this.callbacks.forEach((callback, id) => {
      if (id.startsWith('audioProcess_')) {
        callback(data);
      }
    });
  }

  // --- PUBLIC API ---
  async initialize(config: { sampleRate?: number; fftSize?: number } = {}): Promise<boolean> {
    if (!this.worker) return false;

    return new Promise((resolve) => {
      const messageId = this.generateMessageId();
      
      this.callbacks.set(messageId, (data) => {
        resolve(true);
      });

      this.worker!.postMessage({
        type: 'initialize',
        data: config,
        messageId
      });

      // Timeout after 5 seconds
      setTimeout(() => {
        if (this.callbacks.has(messageId)) {
          this.callbacks.delete(messageId);
          resolve(false);
        }
      }, 5000);
    });
  }

  processAudio(audioData: Float32Array | Uint8Array): void {
    if (!this.worker || !this.isInitialized) return;

    // Queue audio data if currently processing
    if (this.isProcessing) {
      this.processingQueue.push(audioData as Float32Array);
      return;
    }

    this.isProcessing = true;
    this.worker.postMessage({
      type: 'processAudio',
      data: audioData
    });

    // Process next item in queue
    setTimeout(() => {
      if (this.processingQueue.length > 0) {
        const nextData = this.processingQueue.shift();
        this.processAudio(nextData!);
      } else {
        this.isProcessing = false;
      }
    }, 0);
  }

  onAudioProcessed(callback: (data: any) => void): () => void {
    const id = `audioProcess_${this.generateMessageId()}`;
    this.callbacks.set(id, callback);
    
    return () => {
      this.callbacks.delete(id);
    };
  }

  async getStats(): Promise<any> {
    if (!this.worker) return null;

    return new Promise((resolve) => {
      const messageId = this.generateMessageId();
      
      this.callbacks.set(messageId, (data) => {
        resolve(data);
      });

      this.worker!.postMessage({
        type: 'getStats',
        messageId
      });
    });
  }

  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.isInitialized = false;
    this.processingQueue = [];
    this.callbacks.clear();
  }

  private generateMessageId(): string {
    return `msg_${++this.messageId}_${Date.now()}`;
  }
}

// Export singleton instance
export const audioWorker = new ExtremeAudioWorker();

// Hook for React components
export function useAudioWorker() {
  const [isInitialized, setIsInitialized] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [stats, setStats] = React.useState<any>(null);
  const [audioData, setAudioData] = React.useState<any>(null);

  React.useEffect(() => {
    // Initialize worker
    audioWorker.initialize({
      sampleRate: 44100,
      fftSize: 2048
    }).then((success) => {
      setIsInitialized(success);
    });

    // Subscribe to audio processing events
    const unsubscribe = audioWorker.onAudioProcessed((data) => {
      setAudioData(data);
      setIsProcessing(false);
    });

    // Get stats periodically
    const statsInterval = setInterval(async () => {
      const workerStats = await audioWorker.getStats();
      setStats(workerStats);
    }, 1000);

    return () => {
      unsubscribe();
      clearInterval(statsInterval);
    };
  }, []);

  return {
    isInitialized,
    isProcessing,
    stats,
    audioData,
    processAudio: audioWorker.processAudio.bind(audioWorker),
    getStats: audioWorker.getStats.bind(audioWorker),
    terminate: audioWorker.terminate.bind(audioWorker)
  };
}
