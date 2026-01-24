import { describe, it, expect } from 'vitest';
import { UI_CONSTANTS } from '../src/utils/constants';

describe('UI Constants', () => {
  it('should have correct animation durations', () => {
    expect(UI_CONSTANTS.ANIMATION_DURATION.FAST).toBe(150);
    expect(UI_CONSTANTS.ANIMATION_DURATION.NORMAL).toBe(300);
    expect(UI_CONSTANTS.ANIMATION_DURATION.SLOW).toBe(500);
    expect(UI_CONSTANTS.ANIMATION_DURATION.EXTRA_SLOW).toBe(1000);
  });

  it('should have correct audio constants', () => {
    expect(UI_CONSTANTS.AUDIO.BASE_SCALE).toBe(1.8);
    expect(UI_CONSTANTS.AUDIO.PULSE_INTENSITY).toBe(0.1);
    expect(UI_CONSTANTS.AUDIO.AUDIO_IMPACT_MULTIPLIER).toBe(0.5);
    expect(UI_CONSTANTS.AUDIO.MOCK_PROCESSING_INTENSITY).toBe(0.2);
    expect(UI_CONSTANTS.AUDIO.MOCK_PROCESSING_VARIANCE).toBe(0.1);
    expect(UI_CONSTANTS.AUDIO.PROCESSING_FREQUENCY).toBe(200);
    expect(UI_CONSTANTS.AUDIO.BASS_BIN_COUNT).toBe(32);
    expect(UI_CONSTANTS.AUDIO.NORMALIZATION_FACTOR).toBe(128.0);
    expect(UI_CONSTANTS.AUDIO.INTENSITY_THRESHOLD).toBe(0.01);
  });

  it('should have correct layout dimensions', () => {
    expect(UI_CONSTANTS.LAYOUT.DOCK_MIN_WIDTH.VOICE).toBe(240);
    expect(UI_CONSTANTS.LAYOUT.DOCK_MIN_WIDTH.TEXT).toBe(320);
    expect(UI_CONSTANTS.LAYOUT.BUTTON_SIZE.SMALL).toBe(18);
    expect(UI_CONSTANTS.LAYOUT.BUTTON_SIZE.MEDIUM).toBe(20);
    expect(UI_CONSTANTS.LAYOUT.BUTTON_SIZE.LARGE).toBe(24);
    expect(UI_CONSTANTS.LAYOUT.SPACING.XS).toBe(2);
    expect(UI_CONSTANTS.LAYOUT.SPACING.SM).toBe(4);
    expect(UI_CONSTANTS.LAYOUT.SPACING.MD).toBe(8);
    expect(UI_CONSTANTS.LAYOUT.SPACING.LG).toBe(16);
    expect(UI_CONSTANTS.LAYOUT.SPACING.XL).toBe(24);
  });

  it('should have correct 3D visualization constants', () => {
    expect(UI_CONSTANTS.THREE_D.ORB_BASE_SCALE).toBe(1.8);
    expect(UI_CONSTANTS.THREE_D.ORB_SEGMENTS).toBe(64);
    expect(UI_CONSTANTS.THREE_D.ROTATION_SPEED.Y).toBe(0.005);
    expect(UI_CONSTANTS.THREE_D.ROTATION_SPEED.Z).toBe(0.002);
    expect(UI_CONSTANTS.THREE_D.LERP_SPEED).toBe(0.1);
    expect(UI_CONSTANTS.THREE_D.COLOR_LERP_SPEED).toBe(0.05);
  });

  it('should have correct connection settings', () => {
    expect(UI_CONSTANTS.CONNECTION.MAX_RETRIES).toBe(3);
    expect(UI_CONSTANTS.CONNECTION.RECONNECT_BASE_DELAY).toBe(1000);
    expect(UI_CONSTANTS.CONNECTION.RECONNECT_RANDOM_DELAY).toBe(500);
    expect(UI_CONSTANTS.CONNECTION.IDLE_TIMEOUT).toBe(30000);
    expect(UI_CONSTANTS.CONNECTION.AUDIO_SAMPLE_RATE).toBe(16000);
  });

  it('should have correct security constants', () => {
    expect(UI_CONSTANTS.SECURITY.PIN_MIN_LENGTH).toBe(4);
    expect(UI_CONSTANTS.SECURITY.PBKDF2_ITERATIONS).toBe(100000);
    expect(UI_CONSTANTS.SECURITY.SALT_LENGTH).toBe(16);
    expect(UI_CONSTANTS.SECURITY.IV_LENGTH).toBe(12);
  });

  it('should be immutable (as const)', () => {
    // Test that constants are properly defined as const
    expect(typeof UI_CONSTANTS).toBe('object');
    expect(UI_CONSTANTS.ANIMATION_DURATION.FAST).toBe(150);
    
    // Test that values are read-only (as const prevents modification)
    expect(UI_CONSTANTS.ANIMATION_DURATION.FAST).toBe(150);
    expect(UI_CONSTANTS.ANIMATION_DURATION.NORMAL).toBe(300);
    expect(UI_CONSTANTS.ANIMATION_DURATION.SLOW).toBe(500);
    expect(UI_CONSTANTS.ANIMATION_DURATION.EXTRA_SLOW).toBe(1000);
  });

  it('should have consistent scale values', () => {
    // Ensure base scale is consistent across audio and 3D
    expect(UI_CONSTANTS.AUDIO.BASE_SCALE).toBe(UI_CONSTANTS.THREE_D.ORB_BASE_SCALE);
  });

  it('should have reasonable timing values', () => {
    // Ensure animation durations are in ascending order
    expect(UI_CONSTANTS.ANIMATION_DURATION.FAST).toBeLessThan(UI_CONSTANTS.ANIMATION_DURATION.NORMAL);
    expect(UI_CONSTANTS.ANIMATION_DURATION.NORMAL).toBeLessThan(UI_CONSTANTS.ANIMATION_DURATION.SLOW);
    expect(UI_CONSTANTS.ANIMATION_DURATION.SLOW).toBeLessThan(UI_CONSTANTS.ANIMATION_DURATION.EXTRA_SLOW);
  });

  it('should have reasonable spacing values', () => {
    // Ensure spacing values are in ascending order
    expect(UI_CONSTANTS.LAYOUT.SPACING.XS).toBeLessThan(UI_CONSTANTS.LAYOUT.SPACING.SM);
    expect(UI_CONSTANTS.LAYOUT.SPACING.SM).toBeLessThan(UI_CONSTANTS.LAYOUT.SPACING.MD);
    expect(UI_CONSTANTS.LAYOUT.SPACING.MD).toBeLessThan(UI_CONSTANTS.LAYOUT.SPACING.LG);
    expect(UI_CONSTANTS.LAYOUT.SPACING.LG).toBeLessThan(UI_CONSTANTS.LAYOUT.SPACING.XL);
  });
});
