
import * as Tone from 'tone';
import { audioContextManager } from './audioContextManager';

// Singleton instance
let sharedContext: AudioContext | null = null;

/**
 * Gets or creates a robust, shared AudioContext.
 * Ensures compatibility between native Web Audio API and Tone.js.
 * This is the "Single Source of Truth" for audio.
 */
export const getSharedAudioContext = () => {
  return audioContextManager.getSharedContext();
};

export const closeSharedAudioContext = async () => {
  if (sharedContext && sharedContext.state !== 'closed') {
    try {
      await sharedContext.close();
    } catch (e) {
      console.error("Error closing context", e);
    }
  }
  sharedContext = null;
};
