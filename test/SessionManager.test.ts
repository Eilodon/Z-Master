import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sessionManager } from '../src/core/connection/SessionManager';
import { useZenStore, useUIStore } from '../store/zenStore';
import { ZenLiveSession } from '../src/core/connection/ZenLiveSession';
import { sendZenTextQuery } from '../services/geminiService';
import { dbService } from '../services/db';
import { detectEmergency } from '../data/emergencyKeywords';

// Mocks
// Mocks
const mockConnect = vi.fn().mockResolvedValue({} as AnalyserNode);
const mockDisconnect = vi.fn();

vi.mock('../src/core/connection/ZenLiveSession', () => {
    return {
        ZenLiveSession: vi.fn(function (this: any) {
            return {
                connect: mockConnect,
                disconnect: mockDisconnect
            };
        })
    };
});

vi.mock('../services/geminiService', () => ({
    sendZenTextQuery: vi.fn()
}));

vi.mock('../services/db', () => ({
    dbService: {
        saveEntry: vi.fn()
    }
}));

vi.mock('../data/emergencyKeywords', () => ({
    detectEmergency: vi.fn().mockReturnValue(false)
}));

vi.mock('../utils/designSystem', () => ({
    haptic: vi.fn()
}));

describe('SessionManager', () => {
    beforeEach(() => {
        // Reset Stores
        useZenStore.setState({
            status: { kind: 'idling' },
            connectionState: 'disconnected',
            zenData: null,
            history: [],
            connectionAttempts: 0
        });
        useUIStore.setState({
            culturalMode: 'Universal',
            language: 'vi',
            inputMode: 'voice'
        });

        vi.clearAllMocks();
    });

    it('connects successfully', async () => {
        await sessionManager.connect();

        expect(ZenLiveSession).toHaveBeenCalled();
        expect(useZenStore.getState().status.kind).toBe('connected_listening');
        expect(useZenStore.getState().connectionState).toBe('connected');
    });

    it('disconnects correctly', async () => {
        // Setup connected state
        await sessionManager.connect();
        sessionManager.disconnect();

        // Mock ZenLiveSession instance usage logic
        // Since we don't have direct access to the private instance, we imply checks
        // But the store should update if handlers were called.
        // Wait, disconnect() calls session.disconnect() but handleDisconnect is a callback from session?
        // No, connect() passes handleDisconnect to ZenLiveSession constructor.
        // The mock ZenLiveSession should trigger the callback if we want full verification, 
        // but sessionManager.disconnect() sets session=null.

        // Check internal state via public getter/methods if available?
        // getAnalyser() should be null
        expect(sessionManager.getAnalyser()).toBe(null);
    });

    it('sends text and updates store', async () => {
        const mockResponse = {
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
        (sendZenTextQuery as any).mockResolvedValue(mockResponse);

        const res = await sessionManager.sendText('Hello');

        expect(sendZenTextQuery).toHaveBeenCalledWith(expect.any(String), 'Hello', 'Universal', 'vi');
        expect(res).toEqual(mockResponse);
        expect(useZenStore.getState().zenData).toEqual(mockResponse);
        expect(useZenStore.getState().status.kind).toBe('idling');
    });

    it('handles emergency detection', async () => {
        // We need to simulate the handleStateChange callback.
        // Since it's private, we can't call it directly.
        // In connect(), we pass this.handleStateChange to ZenLiveSession.
        // So we can capture it from the constructor usage.

        await sessionManager.connect();
        const MockSession = vi.mocked(ZenLiveSession);
        const handleStateChange = MockSession.mock.calls[0][2];

        (detectEmergency as any).mockReturnValue(true);

        // helper to get update
        handleStateChange({ wisdom_text: 'Help me' });

        expect(useUIStore.getState().emergencyActive).toBe(true);
    });

    it('logs to DB when conversation data is complete', async () => {
        await sessionManager.connect();
        const MockSession = vi.mocked(ZenLiveSession);
        const handleStateChange = MockSession.mock.calls[0][2];

        const zenData = {
            emotion: 'joyful' as const,
            wisdom_text: 'Test wisdom',
            user_transcript: 'User said something',
            confidence: 0.9,
            breathing: 'none' as const,
            mindfulness_metrics: { attention_stability: 0.9, emotional_regulation: 0.5, present_moment_awareness: 0.8 },
            reasoning_steps: ['Reasoning...'],
            awareness_stage: 'mindful' as const,
            psychological_dimensions: { contextual: 1, emotional: 1, cultural: 1, wisdom: 1, acceptance: 0, relational: 1 }
        };

        handleStateChange(zenData);

        expect(dbService.saveEntry).toHaveBeenCalled();
        expect(useZenStore.getState().history).toHaveLength(1);
    });

    it('handles connection errors gracefully', async () => {
        // Mock init failure
        const MockSession = vi.mocked(ZenLiveSession);
        MockSession.mockImplementationOnce(function () {
            throw new Error("PermissionDenied");
        });

        await sessionManager.connect();

        expect(useZenStore.getState().status.kind).toBe('idling');
        // PermissionDenied should switch input mode to text
        expect(useUIStore.getState().inputMode).toBe('text');
    });

    it('handles interaction errors', async () => {
        (sendZenTextQuery as any).mockRejectedValue(new Error("Network Error"));
        await sessionManager.sendText("Hi");
        expect(useZenStore.getState().status.kind).toBe('idling');
    });
});
