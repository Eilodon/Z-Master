import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { validateAndGetApiKey, analyzeEnvironment, sendZenTextQuery } from '../services/geminiService';

// Mock localStorage
const localStorageMock = (function () {
    let store: { [key: string]: string } = {};
    return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => {
            store[key] = value.toString();
        },
        clear: () => {
            store = {};
        },
        removeItem: (key: string) => {
            delete store[key];
        },
    };
})();

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
});

// Mock GoogleGenAI class and its methods
const { mockGenerateContent } = vi.hoisted(() => {
    return { mockGenerateContent: vi.fn() };
});

vi.mock('@google/genai', () => {
    return {
        GoogleGenAI: class {
            models = {
                generateContent: mockGenerateContent
            };
            constructor(params: any) { }
        },
        Type: {
            OBJECT: 'object',
            STRING: 'string',
            NUMBER: 'number',
            ARRAY: 'array',
        }
    };
});

describe('Gemini Service', () => {
    beforeEach(() => {
        window.localStorage.clear();
        vi.clearAllMocks();
    });

    describe('validateAndGetApiKey', () => {
        it('returns key from localStorage if present', async () => {
            window.localStorage.setItem('GEMINI_API_KEY', 'test-key');
            const key = await validateAndGetApiKey();
            expect(key).toBe('test-key');
        });

        it('throws if key is missing', async () => {
            await expect(validateAndGetApiKey()).rejects.toThrow('API_KEY_MISSING');
        });
    });

    describe('analyzeEnvironment', () => {
        it('calls AI and returns parsed result', async () => {
            const mockResponse = {
                text: JSON.stringify({ mode: 'VN', detected_items: ['pho'] })
            };
            mockGenerateContent.mockResolvedValue(mockResponse);

            const result = await analyzeEnvironment('key', 'base64img');

            expect(result).toEqual({ mode: 'VN', detected_items: ['pho'] });
            expect(mockGenerateContent).toHaveBeenCalledWith(expect.objectContaining({
                model: 'gemini-1.5-flash',
                contents: expect.any(Array)
            }));
        });

        it('throws if no text returned', async () => {
            mockGenerateContent.mockResolvedValue({ text: null });
            await expect(analyzeEnvironment('key', 'b64')).rejects.toThrow('CAMERA_ANALYSIS_FAILED');
        });
    });

    describe('sendZenTextQuery', () => {
        it('calls AI and returns parsed ZenResponse', async () => {
            const mockZenData = {
                emotion: 'calm',
                wisdom_text: 'Hello',
                wisdom_english: 'Hello',
                breathing: 'none',
                quantum_metrics: { coherence: 1, entanglement: 0, presence: 1 },
                awareness_stage: 'aware',
                consciousness_dimensions: { contextual: 0, emotional: 0, cultural: 0, wisdom: 0, uncertainty: 0, relational: 0 },
                reasoning_steps: [],
                ambient_sound: 'silence'
            };

            mockGenerateContent.mockResolvedValue({ text: JSON.stringify(mockZenData) });

            const result = await sendZenTextQuery('key', 'Hi', 'Universal', 'en');
            expect(result).toEqual(mockZenData);
            expect(mockGenerateContent).toHaveBeenCalledWith(expect.objectContaining({
                model: 'gemini-2.0-flash-exp'
            }));
        });
    });
});
