// Configuration constants to remove magic numbers
export const UI_CONSTANTS = {
  // Animation timing
  ANIMATION_DURATION: {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500,
    EXTRA_SLOW: 1000
  },
  
  // Audio visualization
  AUDIO: {
    BASE_SCALE: 1.8,
    PULSE_INTENSITY: 0.1,
    AUDIO_IMPACT_MULTIPLIER: 0.5,
    MOCK_PROCESSING_INTENSITY: 0.2,
    MOCK_PROCESSING_VARIANCE: 0.1,
    PROCESSING_FREQUENCY: 200,
    BASS_BIN_COUNT: 32,
    NORMALIZATION_FACTOR: 128.0,
    INTENSITY_THRESHOLD: 0.01
  },
  
  // UI dimensions
  LAYOUT: {
    DOCK_MIN_WIDTH: {
      VOICE: 240,
      TEXT: 320
    },
    BUTTON_SIZE: {
      SMALL: 18,
      MEDIUM: 20,
      LARGE: 24
    },
    SPACING: {
      XS: 2,
      SM: 4,
      MD: 8,
      LG: 16,
      XL: 24
    }
  },
  
  // 3D visualization
  THREE_D: {
    ORB_BASE_SCALE: 1.8,
    ORB_SEGMENTS: 64,
    ROTATION_SPEED: {
      Y: 0.005,
      Z: 0.002
    },
    LERP_SPEED: 0.1,
    COLOR_LERP_SPEED: 0.05
  },
  
  // Connection settings
  CONNECTION: {
    MAX_RETRIES: 3,
    RECONNECT_BASE_DELAY: 1000,
    RECONNECT_RANDOM_DELAY: 500,
    IDLE_TIMEOUT: 30000, // 30 seconds
    AUDIO_SAMPLE_RATE: 16000
  },
  
  // Security
  SECURITY: {
    PIN_MIN_LENGTH: 4,
    PBKDF2_ITERATIONS: 100000,
    SALT_LENGTH: 16,
    IV_LENGTH: 12
  }
} as const;

// Type helpers for better type safety
export type AnimationDuration = typeof UI_CONSTANTS.ANIMATION_DURATION[keyof typeof UI_CONSTANTS.ANIMATION_DURATION];
export type ButtonSize = typeof UI_CONSTANTS.LAYOUT.BUTTON_SIZE[keyof typeof UI_CONSTANTS.LAYOUT.BUTTON_SIZE];
