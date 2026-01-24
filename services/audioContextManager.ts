// Audio Context Manager - Thread-safe singleton for managing shared audio context
// Prevents race conditions and ensures proper cleanup

class AudioContextManager {
  private static instance: AudioContextManager;
  private audioContext: AudioContext | null = null;
  private isInitializing = false;
  private initPromise: Promise<AudioContext> | null = null;
  private refCount = 0;
  private readonly maxRefCount = 10; // Prevent memory leaks

  private constructor() { }

  static getInstance(): AudioContextManager {
    if (!AudioContextManager.instance) {
      AudioContextManager.instance = new AudioContextManager();
    }
    return AudioContextManager.instance;
  }

  async getSharedContext(): Promise<AudioContext> {
    // If already initialized and not closed, return existing context
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.refCount++;
      return this.audioContext;
    }

    // If currently initializing, wait for completion
    if (this.isInitializing && this.initPromise) {
      return this.initPromise;
    }

    // Initialize new context
    this.isInitializing = true;
    this.initPromise = this.initializeContext();

    try {
      this.audioContext = await this.initPromise;
      this.refCount = 1;
      return this.audioContext;
    } finally {
      this.isInitializing = false;
      this.initPromise = null;
    }
  }

  private async initializeContext(): Promise<AudioContext> {
    try {
      // Create new audio context with optimal settings
      // Attempt to force 24kHz for speech optimization (supported in modern browsers)
      const contextOptions: AudioContextOptions = {
        sampleRate: 24000,
        latencyHint: 'interactive'
      };

      const context = new (window.AudioContext || (window as any).webkitAudioContext)(contextOptions);

      // Resume context if suspended (common in mobile browsers)
      if (context.state === 'suspended') {
        await context.resume();
      }

      // Set optimal audio parameters for voice processing
      if (context.sampleRate !== 24000) {
        console.warn(`[AudioContext] System enforced sample rate: ${context.sampleRate}Hz. Resampling may be required.`);
        // Note: Downstream processors (AudioWorklet) must handle resampling if necessary.
      }

      // Add error handling
      context.addEventListener('statechange', () => {
        if (context.state === 'closed') {
          console.warn('[AudioContext] Context was closed unexpectedly');
          this.audioContext = null;
          this.refCount = 0;
        }
      });

      return context;
    } catch (error) {
      console.error('[AudioContext] Failed to initialize:', error);
      throw new Error('AudioContext initialization failed');
    }
  }

  // Track pending close to prevent race conditions
  private pendingCloseId: number = 0;

  releaseContext(): void {
    if (this.refCount > 0) {
      this.refCount--;
    }

    // Auto-close when no longer needed and ref count is low
    if (this.refCount === 0 && this.audioContext && this.audioContext.state !== 'closed') {
      // Capture current close ID to prevent stale timeouts from closing new contexts
      const closeId = ++this.pendingCloseId;

      // Delay closure to allow for rapid reconnection
      setTimeout(() => {
        // Only close if this is still the pending close AND refCount is still 0
        if (closeId === this.pendingCloseId && this.refCount === 0 &&
          this.audioContext && this.audioContext.state !== 'closed') {
          this.closeContext();
        }
      }, 1000);
    }
  }

  async closeContext(): Promise<void> {
    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        await this.audioContext.close();
        console.log('[AudioContext] Context closed successfully');
      } catch (error) {
        console.error('[AudioContext] Error closing context:', error);
      } finally {
        this.audioContext = null;
        this.refCount = 0;
      }
    }
  }

  getContextState(): AudioContextState | null {
    return this.audioContext?.state || null;
  }

  getRefCount(): number {
    return this.refCount;
  }

  // Force cleanup for testing or emergency situations
  forceCleanup(): void {
    this.refCount = 0;
    this.closeContext();
  }
}

export const audioContextManager = AudioContextManager.getInstance();

// Legacy compatibility function
export const getSharedAudioContext = (): Promise<AudioContext> => {
  return audioContextManager.getSharedContext();
};
