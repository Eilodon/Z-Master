
import '@testing-library/jest-dom';
import 'fake-indexeddb/auto';
import { TextEncoder, TextDecoder } from 'util';

// Polyfill TextEncoder (HappyDOM might miss it in some edge cases or Jest mode)
global.TextEncoder = TextEncoder;
// @ts-ignore
global.TextDecoder = TextDecoder;

// Polyfill Web Crypto logic for PBKDF2 if node's implementation differs slightly
// Usually Node 20+ globalThis.crypto is fine.

import { vi } from 'vitest';

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(), // deprecated
        removeListener: vi.fn(), // deprecated
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
};

// Mock Tone.js to prevent module resolution issues
vi.mock('tone', () => ({
    default: {},
    Tone: {
        Oscillator: vi.fn(),
        Gain: vi.fn(),
        Context: vi.fn(),
        context: {
            latencyHint: 'interactive',
            lookAhead: 0.1,
            updateInterval: 0.05
        }
    }
}));
